import { resetDemoData } from "@/app/actions";
import { getSession, isAdmin } from "@/lib/session";

export async function Footer() {
  const canReset = process.env.ALLOW_DEMO_RESET !== "false" && Boolean((await getSession()) || (await isAdmin()));
  return (
    <footer className="on-dark mt-12 border-t border-console-rule bg-console text-console-muted">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm">
        <p>All prices, carriers and capacities are invented demo data. No carrier is connected.</p>
        {canReset && (
          <form action={resetDemoData}>
            <button className="font-semibold text-console-text underline underline-offset-2 hover:text-ion-bright">
              Reset demo data
            </button>
          </form>
        )}
      </div>
    </footer>
  );
}
