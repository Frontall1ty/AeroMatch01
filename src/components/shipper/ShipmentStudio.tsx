"use client";

import { useMemo, useRef, useState } from "react";
import { MODE_HEX_BRIGHT, MODE_LABEL, cityName, modesBetween, type Mode } from "@/lib/constants";
import { cargoLayout, type CargoInput } from "@/lib/holds";
import { ShipmentForm, type ShipmentDefaults } from "@/components/ShipmentForm";
import { toNumber } from "@/components/Field";
import { prefersReducedMotion } from "@/components/site/hooks";
import { ModeChooser, type ModeInfo } from "./ModeChooser";
import { HoldView } from "./HoldView";

/** The load shown inside before the shipper has typed anything: the demo shipment's 25 crates. */
const SAMPLE: CargoInput = { cargoKind: "GENERAL", pieces: 25, piece: { lengthCm: 160, widthCm: 100, heightCm: 100, weightKg: 240, stackable: true } };

const pos = (s: string) => {
  const n = toNumber(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** The form's values as the hold picture reads them. */
export function cargoFrom(v: ShipmentDefaults): CargoInput {
  if (v.cargoKind === "VEHICLES") return { cargoKind: "VEHICLES", vehicleCount: pos(v.vehicleCount) };
  if (v.sizeMode === "PIECES") {
    const [l, w, h] = [pos(v.pieceLengthCm), pos(v.pieceWidthCm), pos(v.pieceHeightCm)];
    return {
      cargoKind: "GENERAL",
      pieces: pos(v.pieces),
      piece: l && w && h ? { lengthCm: l, widthCm: w, heightCm: h, weightKg: pos(v.pieceWeightKg) ?? 0, stackable: v.stackable } : null,
    };
  }
  return { cargoKind: "GENERAL", volumeM3: pos(v.volumeM3) };
}

function scrollToId(id: string, focus?: HTMLElement | null) {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  focus?.focus({ preventScroll: true });
}

/**
 * The new-shipment page: step 1 picks a way to ship (or all four), step 2 is the form, with the cargo space of the
 * chosen way drawn next to it and filled as the shipper types. When editing a shipment, step 1 is skipped.
 */
export function ShipmentStudio({
  defaults,
  demo,
  today,
  info,
  home,
  chooser = true,
}: {
  defaults: ShipmentDefaults;
  demo: ShipmentDefaults;
  today: string;
  info: Record<Mode, ModeInfo>;
  home: string;
  chooser?: boolean;
}) {
  const [preferred, setPreferred] = useState<Mode | null>(null);
  const [values, setValues] = useState<ShipmentDefaults>(defaults);
  const [tab, setTab] = useState<Mode | null>(null);
  const step2 = useRef<HTMLHeadingElement>(null);
  const step1 = useRef<HTMLDivElement>(null);

  const cargo = useMemo(() => cargoFrom(values), [values]);
  const typed = useMemo(() => cargoLayout("ROAD", cargo).state !== "empty", [cargo]);
  const lane = useMemo(() => modesBetween(values.origin, values.destination), [values.origin, values.destination]);
  const preferredOnLane = preferred && lane.includes(preferred) ? preferred : null;
  const shown: Mode = (tab && lane.includes(tab) ? tab : null) ?? preferredOnLane ?? lane[0] ?? "ROAD";

  function choose(m: Mode | null) {
    setPreferred(m);
    setTab(null);
    requestAnimationFrame(() => scrollToId("cargo", step2.current));
  }

  return (
    <div>
      <h1 className="sr-only">New shipment</h1>
      {chooser && (
        <div id="ways" ref={step1} tabIndex={-1} className="scroll-mt-24 outline-none">
          <ModeChooser info={info} home={home} cargo={typed ? cargo : null} sample={SAMPLE} onChoose={choose} />
        </div>
      )}

      <section id="cargo" aria-labelledby="step2" className={chooser ? "mt-16 scroll-mt-20 border-t border-rule pt-10" : ""}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {chooser && <p className="site-label site-label-ink text-muted">Step 2 of 2 · Your cargo</p>}
            <h2 id="step2" ref={step2} tabIndex={-1} className="display mt-3 text-[clamp(36px,4.5vw,56px)] leading-[0.95] outline-none">
              What are you sending?
            </h2>
          </div>
          {chooser && (
            <p className="flex flex-wrap items-center gap-2 rounded-full border border-rule bg-panel py-1.5 pl-4 pr-1.5 text-sm shadow-[0_8px_20px_-14px_rgba(14,14,16,0.5)]">
              {preferred ? (
                <span>
                  Opens on <strong>{MODE_LABEL[preferred].toLowerCase()}</strong>, compares all
                </span>
              ) : (
                <span>Compares every way to ship</span>
              )}
              <button type="button" className="min-h-[36px] rounded-full bg-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-ion-bright hover:text-ink" onClick={() => scrollToId("ways", step1.current)}>
                Change
              </button>
            </p>
          )}
        </div>
        {preferred && !preferredOnLane && lane.length > 0 && (
          <p role="status" className="mt-4 rounded border border-rule bg-panel px-3 py-2 text-sm">
            {MODE_LABEL[preferred]} is not offered from {cityName(values.origin)} to {cityName(values.destination)}. The comparison shows the ways that are:{" "}
            {lane.map((m) => MODE_LABEL[m].toLowerCase()).join(", ")}.
          </p>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
          <ShipmentForm defaults={defaults} demo={demo} today={today} preferredMode={preferredOnLane} onChange={setValues} />
          <aside aria-labelledby="inside-title" className="hold-panel on-dark rounded-[24px] bg-console p-5 text-console-text lg:sticky lg:top-20">
            <h3 id="inside-title" className="site-label text-console-muted">Your cargo, inside</h3>
            {lane.length > 1 && (
              <div role="group" aria-label="Show inside" className="mt-3 flex flex-wrap gap-2">
                {lane.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={shown === m}
                    onClick={() => setTab(m)}
                    className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors ${
                      shown === m ? "border-white bg-white text-ink" : "border-white/20 hover:border-white/60"
                    }`}
                  >
                    <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: MODE_HEX_BRIGHT[m] }} />
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            )}
            <HoldView mode={shown} cargo={cargo} dark className="mt-4" />
          </aside>
        </div>
      </section>
    </div>
  );
}
