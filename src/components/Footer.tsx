import { resetDemoData } from "@/app/actions";

export function Footer() {
  const canReset = process.env.ALLOW_DEMO_RESET !== "false";
  return (
    <footer className="mt-12 border-t border-rule bg-panel">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-muted">
        <p>Demo mode: no real authentication. All prices, carriers and capacities are invented.</p>
        {canReset && (
          <form action={resetDemoData}>
            <button className="font-semibold text-ink underline underline-offset-2 hover:no-underline">
              Reset demo data
            </button>
          </form>
        )}
      </div>
    </footer>
  );
}
