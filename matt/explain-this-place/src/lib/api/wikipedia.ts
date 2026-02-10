import { z } from "zod";

const WikiSummary = z.object({
  title: z.string(),
  extract: z.string().optional(),
  content_urls: z
    .object({
      desktop: z.object({ page: z.string() }).optional(),
    })
    .optional(),
  thumbnail: z.object({ source: z.string() }).optional(),
  originalimage: z.object({ source: z.string() }).optional(),
});

export type WikiSummaryResult = z.infer<typeof WikiSummary>;

export async function fetchWikiSummary(
  title: string,
  signal?: AbortSignal
): Promise<WikiSummaryResult | null> {
  const t = title.trim();
  if (!t) return null;

  // REST summary endpoint
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`;

  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;

  const json = await res.json();
  const parsed = WikiSummary.safeParse(json);
  if (!parsed.success) return null;

  return parsed.data;
}

