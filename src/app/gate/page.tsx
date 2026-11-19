import { PasscodeInput } from "./PasscodeInput";

export const dynamic = "force-dynamic";

export default async function Gate({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Enter the demo passcode</h1>
      <p className="mt-2 text-sm text-muted">This demo link is private. Use the passcode you were given.</p>
      <form action="/api/gate" method="post" className="mt-5">
        <label htmlFor="passcode" className="field-label">
          Passcode
        </label>
        <PasscodeInput invalid={!!error} />
        {error === "wrong" && <p className="field-error">That passcode is not correct. Check it and try again. Use the Show button to see what you typed.</p>}
        {error === "wait" && <p className="field-error">Too many attempts. Wait a minute and try again.</p>}
        <button className="btn mt-4 w-full">Open demo</button>
      </form>
    </main>
  );
}
