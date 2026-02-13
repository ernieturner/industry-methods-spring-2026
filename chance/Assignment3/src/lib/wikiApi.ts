import { z } from 'zod';
import type { HotPage } from './types';

const RecentChangesSchema = z.object({
  query: z.object({
    recentchanges: z.array(
      z.object({
        title: z.string(),
        timestamp: z.string(),
        type: z.string()
      })
    )
  })
});

const TopPageviewsSchema = z.object({
  items: z.array(
    z.object({
      articles: z.array(
        z.object({
          article: z.string(),
          views: z.number()
        })
      )
    })
  )
});

const HourlyPageviewsSchema = z.object({
  items: z.array(
    z.object({
      views: z.number()
    })
  )
});

interface RecentChange {
  title: string;
  timestamp: string;
}

async function fetchRecentChanges(limit = 500): Promise<RecentChange[]> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('list', 'recentchanges');
  url.searchParams.set('rcnamespace', '0');
  url.searchParams.set('rctype', 'edit|new');
  url.searchParams.set('rcprop', 'title|timestamp|type');
  url.searchParams.set('rclimit', String(limit));
  url.searchParams.set('origin', '*');

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Wikimedia API failed with status ${response.status}.`);
  }

  const parsed = RecentChangesSchema.parse((await response.json()) as unknown);
  return parsed.query.recentchanges.map((entry) => ({ title: entry.title, timestamp: entry.timestamp }));
}

function formatUtcDay(date: Date): { year: string; month: string; day: string } {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0')
  };
}

function formatUtcHourKey(date: Date): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  return `${year}${month}${day}${hour}`;
}

function normalizeArticleTitle(article: string): string {
  const decoded = decodeURIComponent(article);
  return decoded.replace(/_/g, ' ');
}

async function fetchTopPagesByViews(limit = 300): Promise<Map<string, number>> {
  const now = new Date();
  const dayOffsets = [1, 2, 3, 4, 5, 6, 7];

  for (const offset of dayOffsets) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const { year, month, day } = formatUtcDay(date);
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      continue;
    }

    const parsed = TopPageviewsSchema.parse((await response.json()) as unknown);
    const first = parsed.items[0];
    if (!first) {
      continue;
    }

    const map = new Map<string, number>();
    first.articles
      .filter((article) => article.article !== 'Main_Page' && !article.article.startsWith('Special:'))
      .slice(0, limit)
      .forEach((article) => {
        map.set(normalizeArticleTitle(article.article), article.views);
      });

    if (map.size > 0) {
      return map;
    }
  }

  return new Map<string, number>();
}

function countEditsByTitle(changes: RecentChange[], sinceTimeMs: number): Map<string, number> {
  const counts = new Map<string, number>();

  changes.forEach((change) => {
    const timestamp = new Date(change.timestamp).getTime();
    if (timestamp < sinceTimeMs) return;

    const next = (counts.get(change.title) ?? 0) + 1;
    counts.set(change.title, next);
  });

  return counts;
}

export async function fetchHotPages(limit = 12): Promise<HotPage[]> {
  const [changes, topViews] = await Promise.all([fetchRecentChanges(500), fetchTopPagesByViews(300)]);
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const fiveMinutesAgo = now - 5 * 60_000;

  const counts1m = countEditsByTitle(changes, oneMinuteAgo);
  const counts5m = countEditsByTitle(changes, fiveMinutesAgo);

  const candidateTitles = new Set<string>([...topViews.keys(), ...counts5m.keys()]);
  const pages = [...candidateTitles].map((title) => {
    const edits5m = counts5m.get(title) ?? 0;
    const edits1m = counts1m.get(title) ?? 0;
    const views24h = topViews.get(title) ?? 0;
    return { title, edits5m, edits1m, views24h };
  });

  return pages
    .filter((page) => page.views24h > 0 || page.edits5m > 0)
    .sort((a, b) => {
      const scoreA = a.edits5m * 1200 + a.edits1m * 600 + Math.log10(a.views24h + 1) * 250;
      const scoreB = b.edits5m * 1200 + b.edits1m * 600 + Math.log10(b.views24h + 1) * 250;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export async function fetchEditsSinceByTitle(titles: string[], sinceIso: string): Promise<Map<string, number>> {
  const uniqueTitles = [...new Set(titles)];
  const result = new Map(uniqueTitles.map((title) => [title, 0]));

  if (uniqueTitles.length === 0) {
    return result;
  }

  const sinceMs = new Date(sinceIso).getTime();
  const changes = await fetchRecentChanges(500);

  changes.forEach((change) => {
    if (!result.has(change.title)) return;
    if (new Date(change.timestamp).getTime() < sinceMs) return;
    result.set(change.title, (result.get(change.title) ?? 0) + 1);
  });

  return result;
}

async function fetchCurrentHourViews(title: string): Promise<number | null> {
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const article = encodeURIComponent(title.replace(/\s+/g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user/${article}/hourly/${formatUtcHourKey(
    start
  )}/${formatUtcHourKey(now)}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    return null;
  }

  const parsed = HourlyPageviewsSchema.parse((await response.json()) as unknown);
  const latest = parsed.items[parsed.items.length - 1];
  return latest?.views ?? null;
}

export async function fetchCurrentHourViewsByTitle(titles: string[]): Promise<Map<string, number | null>> {
  const uniqueTitles = [...new Set(titles)];
  const pairs = await Promise.all(
    uniqueTitles.map(async (title) => {
      try {
        const views = await fetchCurrentHourViews(title);
        return [title, views] as const;
      } catch {
        return [title, null] as const;
      }
    })
  );

  return new Map(pairs);
}

export function wikiPageUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
}
