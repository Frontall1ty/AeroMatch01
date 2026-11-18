"use client";

import { useMemo, useState } from "react";
import { MODE_LABEL, type Mode } from "@/lib/constants";
import { cityByCode, destinationsFrom, distanceKm, groupByRegion, modesBetween, popularFrom, searchCities } from "@/lib/places";
import { int } from "@/lib/format";

const SQUARE: Record<Mode, string> = { AIR: "bg-air", SEA: "bg-sea", RAIL: "bg-rail", ROAD: "bg-road" };

/** The modes that run between two cities. Mode color only identifies the mode. */
function ModeChips({ modes }: { modes: Mode[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {modes.map((m) => (
        <span key={m} className="inline-flex items-center gap-1 text-xs font-semibold">
          <span aria-hidden className={`h-2 w-2 rounded-sm ${SQUARE[m]}`} />
          {MODE_LABEL[m]}
        </span>
      ))}
    </span>
  );
}

/**
 * Where to? Search by city or country, or pick a popular one. Every city shows which modes run there from
 * the starting city, so the shipper sees the options before choosing.
 */
export function DestinationPicker({
  origin,
  value,
  onChange,
  error,
}: {
  origin: string;
  value: string;
  onChange: (code: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const all = useMemo(() => destinationsFrom(origin), [origin]);
  const popular = useMemo(() => popularFrom(origin, 5), [origin]);
  const found = useMemo(() => searchCities(all, query), [all, query]);
  const groups = useMemo(() => groupByRegion(found), [found]);
  const selected = cityByCode(value);

  return (
    <fieldset className="mb-6">
      <legend className="field-label">Where to?</legend>

      {selected && (
        <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-ink px-4 py-3" aria-live="polite">
          <span className="condensed text-[32px] font-bold leading-none">{selected.code}</span>
          <span>
            <span className="block font-semibold">{selected.name}, {selected.country}</span>
            <span className="text-xs text-muted">{int(distanceKm(origin, selected.code))} km in a straight line</span>
          </span>
          <span className="ml-auto"><ModeChips modes={modesBetween(origin, selected.code)} /></span>
        </p>
      )}

      <label htmlFor="destination-search" className="sr-only">Search a city or country</label>
      <input
        id="destination-search"
        type="search"
        autoComplete="off"
        placeholder="Search a city or country"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!query && (
        <div className="mt-3" role="group" aria-label="Popular destinations">
          <p className="mb-1.5 text-xs font-semibold text-muted">Popular from {cityByCode(origin)?.name}</p>
          <div className="flex flex-wrap gap-2">
            {popular.map((c) => (
              <button
                key={c.code}
                type="button"
                aria-pressed={value === c.code}
                onClick={() => onChange(c.code)}
                className={`inline-flex min-h-[36px] items-center gap-2 rounded border px-3 text-sm font-semibold ${value === c.code ? "border-ink bg-ink text-white" : "border-rule bg-panel hover:border-ink"}`}
              >
                <span className="condensed text-base">{c.code}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">{found.length} {found.length === 1 ? "destination" : "destinations"} found</p>

      <div className="mt-3 max-h-80 overflow-y-auto rounded border border-rule bg-panel" tabIndex={-1}>
        {groups.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            No city matches "{query}". Try the name of the country, or the airport code. More cities are added as carriers join.
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.region}>
              <p className="sticky top-0 z-10 border-b border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-muted">{g.region}</p>
              <div className="divide-y divide-rule">
                {g.cities.map((c) => (
                  <label
                    key={c.code}
                    className={`flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 hover:bg-paper focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-air ${value === c.code ? "bg-paper" : ""}`}
                  >
                    <input type="radio" name="destination" value={c.code} checked={value === c.code} onChange={() => onChange(c.code)} className="sr-only" />
                    <span className="condensed w-12 text-xl font-bold leading-none">{c.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{c.name}</span>
                      <span className="text-xs text-muted">{c.country}</span>
                    </span>
                    <ModeChips modes={modesBetween(origin, c.code)} />
                    <span className="w-16 text-right text-xs text-muted">{int(distanceKm(origin, c.code))} km</span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}
