import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Place } from "../lib/types/domain";
import { fetchWikiSummary } from "../lib/api/wikipedia";
import { fetch7DayForecast, type DailyForecast } from "../lib/api/openMeteo";
import { fetchCountryByCode, type CountryInfo } from "../lib/api/restCountries";
import {
  bestThisWeekFromForecast,
  bestTimeHeuristic,
  crowdsHeuristic,
  priceHeuristic,
} from "../lib/heuristics/estimates";
import { isFavorite, toggleFavorite } from "../lib/storage/favorites";
import { Badge, Button, Card, CardDesc, CardTitle } from "../components/ui";

function parsePlace(params: URLSearchParams): Place | null {
  const name = params.get("name")?.trim() ?? "";
  const displayName = params.get("displayName")?.trim() ?? name;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const country = params.get("country");
  const cc = params.get("cc");

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    name,
    displayName,
    lat,
    lon,
    country: country ? country : null,
    countryCode: cc ? cc : null,
  };
}

function cToF(c: number): number {
  return c * (9 / 5) + 32;
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function weatherEmoji(precipMm: number, windKph: number): string {
  if (precipMm >= 8) return "🌧️";
  if (precipMm >= 2) return "🌦️";
  if (windKph >= 35) return "💨";
  return "☀️";
}

type MiniStatProps = { label: string; value: React.ReactNode };
function MiniStat({ label, value }: MiniStatProps) {
  return (
    <Card className="p-8">
      <div className="section-content">
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
          {label}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--app-text)]">
          {value}
        </div>
      </div>
    </Card>
  );
}

export default function PlacePage() {
  const [params] = useSearchParams();
  const place = useMemo(() => parsePlace(params), [params]);

  const [wiki, setWiki] = useState<Awaited<ReturnType<typeof fetchWikiSummary>>>(null);
  const [forecast, setForecast] = useState<DailyForecast[] | null>(null);
  const [country, setCountry] = useState<CountryInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!place) return;
    setFav(isFavorite(place));
  }, [place]);

  useEffect(() => {
    if (!place) return;

    const ac = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const [w, f, c] = await Promise.all([
          fetchWikiSummary(place.name, ac.signal),
          fetch7DayForecast(place.lat, place.lon, ac.signal),
          place.countryCode
            ? fetchCountryByCode(place.countryCode, ac.signal)
            : Promise.resolve(null),
        ]);

        if (ac.signal.aborted) return;

        setWiki(w);
        setForecast(f);
        setCountry(c);
      } catch (e) {
        if (ac.signal.aborted) return;
        setErr(e instanceof Error ? e.message : "Failed to load place report");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [place]);

  if (!place) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
          Missing place details
        </h1>
        <p className="text-[var(--muted)]">
          Go back and select a place from search so we have coordinates.
        </p>
        <Link to="/" className="text-[var(--accent)] hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=12/${place.lat}/${place.lon}`;

  const crowds = crowdsHeuristic(wiki?.extract);
  const price = priceHeuristic(country);
  const seasonal = bestTimeHeuristic(place.lat);
  const bestThisWeek = forecast ? bestThisWeekFromForecast(forecast) : null;

  const imageUrl = wiki?.originalimage?.source ?? wiki?.thumbnail?.source ?? null;

  const shareUrl = useMemo(() => new URL(window.location.href).toString(), []);

  const forecast7 = forecast ? forecast.slice(0, 7) : null;

  return (
    <div className="space-y-32 place-section-gap">
      {/* Hero */}
      <Card className="p-0 overflow-hidden">
        <div className="p-7 bg-gradient-to-br from-white/80 to-transparent dark:from-black/20 dark:to-transparent section-content">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-5xl font-bold tracking-tight text-[var(--app-text)]">
                {place.name}
              </h1>
              <p className="mt-1 text-[var(--muted)] truncate">
                {place.displayName}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {place.country ? <Badge>{place.country}</Badge> : null}
                <Badge>
                  {place.lat.toFixed(2)}, {place.lon.toFixed(2)}
                </Badge>
                <Badge>🧭 Client-only</Badge>
                <Badge>🛰️ Free public APIs</Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[color:var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium hover:bg-white/90 dark:hover:bg-white/10 transition"
              >
                Open map
              </a>

              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  } catch {
                    // ignore
                  }
                }}
              >
                {copied ? "Copied!" : "Copy link"}
              </Button>

              <button
                onClick={() => {
                  const next = toggleFavorite(place);
                  setFav(
                    next.some(
                      (p) =>
                        p.lat === place.lat &&
                        p.lon === place.lon &&
                        p.displayName === place.displayName
                    )
                  );
                }}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  fav
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "border border-[color:var(--card-border)] bg-[var(--card-bg)] hover:bg-white/90 dark:hover:bg-white/10 text-[var(--app-text)]",
                ].join(" ")}
              >
                {fav ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {err ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {err}
            </div>
          ) : null}
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 place-grid-gap place-stats-gap header-gap">
        <MiniStat label="Crowds (estimate)" value={crowds.level} />
        <MiniStat label="Price (estimate)" value={price.level} />
        <MiniStat
          label="Best time (estimate)"
          value={<span className="text-base font-semibold">{seasonal}</span>}
        />
      </div>

      {/* Overview + Photo */}
      <div className="grid gap-16 lg:grid-cols-3 place-grid-gap header-gap">
        <Card className="lg:col-span-2 p-10 section-content">
          <CardTitle>Overview</CardTitle>
          <CardDesc>Based on Wikipedia + public data.</CardDesc>

          <div className="mt-8">
            {loading ? (
              <p className="text-[var(--muted)]">Loading summary…</p>
            ) : wiki?.extract ? (
              <>
                <p className="text-[var(--app-text)] leading-relaxed">
                  {wiki.extract}
                </p>
                {wiki.content_urls?.desktop?.page ? (
                  <a
                    className="mt-4 inline-block text-[var(--accent)] hover:underline"
                    href={wiki.content_urls.desktop.page}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read more on Wikipedia
                  </a>
                ) : null}
              </>
            ) : (
              <p className="text-[var(--muted)]">
                No Wikipedia summary found for this exact name. Try a nearby major city.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-10 section-content">
          <CardTitle>Photo</CardTitle>
          <CardDesc>From Wikipedia, when available.</CardDesc>

          <div className="mt-8">
            {imageUrl ? (
              <div className="overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
                <img
                  src={imageUrl}
                  alt={place.name}
                  className="h-64 w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="text-[var(--muted)]">No image available.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Estimate explanations */}
      <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3 place-grid-gap place-section-pad">
        <Card className="p-10 section-content">
          <CardTitle>Crowds</CardTitle>
          <CardDesc>Estimate based on public descriptions.</CardDesc>
          <div className="mt-4 text-3xl font-bold tracking-tight text-[var(--app-text)]">
            {crowds.level}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{crowds.note}</p>
        </Card>

        <Card className="p-10 section-content">
          <CardTitle>Price</CardTitle>
          <CardDesc>Estimate based on region.</CardDesc>
          <div className="mt-4 text-3xl font-bold tracking-tight text-[var(--app-text)]">
            {price.level}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{price.note}</p>
        </Card>

        <Card className="p-10 section-content">
          <CardTitle>This week</CardTitle>
          <CardDesc>Best-looking day from the 7-day forecast.</CardDesc>
          <div className="mt-4 text-[var(--app-text)]">
            {bestThisWeek ? (
              <div className="rounded-2xl bg-black/5 p-4 text-sm text-[var(--app-text)] dark:bg-white/5">
                {bestThisWeek}
              </div>
            ) : (
              <div className="text-[var(--muted)]">No forecast available.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Forecast: 7 cards */}
      <Card className="p-10 section-content">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>7-day forecast</CardTitle>
            <CardDesc>Max/min temperature, rain, and wind.</CardDesc>
          </div>
          <Badge>Open-Meteo</Badge>
        </div>

        <div className="mt-12">
          {loading ? (
            <p className="text-[var(--muted)]">Loading forecast…</p>
          ) : forecast7 ? (
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 weather-grid-gap">
              {forecast7.map((d) => {
                const emoji = weatherEmoji(d.precipMm, d.windMaxKph);
                return (
                  <div
                    key={d.date}
                    className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--card-bg)] p-5 pb-3 shadow-sm hover:shadow-md transition min-h-[140px] weather-card-tight weather-card-rounded weather-card-compact"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--app-text)]">
                        {formatShortDate(d.date)}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-center" aria-hidden="true">
                      <div className="text-7xl leading-none">{emoji}</div>
                    </div>

                    <div className="mt-3 text-3xl font-bold tracking-tight text-[var(--app-text)]">
                      {Math.round(d.tMaxC)}°
                    </div>

                    <div className="text-sm text-[var(--muted)]">
                      Low {Math.round(d.tMinC)}° ·{" "}
                      <span className="text-[color:var(--muted)]">
                        {Math.round(cToF(d.tMaxC))}°F
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-[var(--muted)] weather-meta">
                      <div className="flex items-center justify-between">
                        <span>Rain</span>
                        <span className="font-medium text-[var(--app-text)]">
                          {d.precipMm.toFixed(1)} mm
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Wind</span>
                        <span className="font-medium text-[var(--app-text)]">
                          {d.windMaxKph.toFixed(0)} km/h
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--muted)]">Forecast unavailable.</p>
          )}
        </div>
      </Card>

      {/* Things to do / eat */}
      <div className="grid gap-16 md:grid-cols-2 place-grid-gap header-gap section-bottom-gap">
        <Card className="p-10 section-content">
          <CardTitle>Things to do</CardTitle>
          <CardDesc>Starter ideas (general).</CardDesc>
          <ul className="mt-4 list-disc pl-5 text-[var(--app-text)] space-y-2">
            <li>Walk the historic center / main neighborhoods</li>
            <li>Visit top museums and local markets</li>
            <li>Find viewpoints / scenic spots</li>
            <li>Day trip to nearby nature or small towns</li>
            <li>Try a local tour (food, history, or nightlife)</li>
          </ul>
        </Card>

        <Card className="p-10 section-content">
          <CardTitle>What to eat</CardTitle>
          <CardDesc>Starter ideas (general).</CardDesc>
          <ul className="mt-4 list-disc pl-5 text-[var(--app-text)] space-y-2">
            <li>Look for a well-reviewed local “traditional” restaurant</li>
            <li>Try street food / market stalls</li>
            <li>Ask locals what’s seasonal right now</li>
            <li>Find the iconic dessert/snack for the region</li>
            <li>Do a food tour on your first day</li>
          </ul>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Link to="/" className="text-[var(--accent)] hover:underline">
          ← Back to search
        </Link>
        <Button variant="primary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </Button>
      </div>
    </div>
  );
}
