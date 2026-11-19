"use client";

import { useState } from "react";

/** The passcode field with a Show button, so a typo or the wrong keyboard layout can be seen. */
export function PasscodeInput({ invalid }: { invalid: boolean }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        id="passcode"
        name="passcode"
        type={shown ? "text" : "password"}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        required
        aria-invalid={invalid}
      />
      <button type="button" className="btn-secondary shrink-0" aria-pressed={shown} onClick={() => setShown((v) => !v)}>
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}
