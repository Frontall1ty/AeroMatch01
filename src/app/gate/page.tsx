import { Brand } from "@/components/Brand";
import { PasscodeInput } from "./PasscodeInput";

export const dynamic = "force-dynamic";

export default async function Gate({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="on-dark aurora min-h-screen bg-console text-console-text">
      <header className="border-b border-console-rule">
        <div className="mx-auto flex max-w-[1180px] items-center px-4 py-2.5"><Brand /></div>
      </header>
      <main id="main" className="mx-auto max-w-sm px-4 py-16">
        <div className="route-rule mb-6 w-24" aria-hidden />
        <h1 className="h-wide text-[26px]">Enter the demo passcode</h1>
        <p className="mt-2 text-sm text-console-muted">This demo link is private. Use the passcode you were given.</p>
        <form action="/api/gate" method="post" className="panel-dark ticks mt-6 p-5">
          <label htmlFor="passcode" className="field-label">
            Passcode
          </label>
          <PasscodeInput invalid={!!error} />
          {error === "wrong" && <p className="field-error">That passcode is not correct. Check it and try again. Use the Show button to see what you typed.</p>}
          {error === "wait" && <p className="field-error">Too many attempts. Wait a minute and try again.</p>}
          <button className="btn-bright mt-4 w-full">Open demo</button>
        </form>
        <p className="mt-4 text-xs text-console-muted">All prices, carriers and capacities in the demo are invented.</p>
      </main>
    </div>
  );
}
