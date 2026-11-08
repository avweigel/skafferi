"use client";

import { useRef, useState, useTransition } from "react";
import { inviteMember } from "@/lib/actions/household";

export function InviteForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="card space-y-3 p-4"
      action={(formData) => {
        setError(null);
        setSent(false);
        start(async () => {
          const result = await inviteMember(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSent(true);
          formRef.current?.reset();
        });
      }}
    >
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          autoCapitalize="off"
          placeholder="partner@example.com"
          className="field"
          disabled={pending}
        />
        <button type="submit" disabled={pending} className="btn btn-primary shrink-0">
          {pending ? "Adding" : "Invite"}
        </button>
      </div>
      {error && <p className="text-[14px] text-(--danger)">{error}</p>}
      {sent && <p className="text-[14px] text-(--ok)">Invite added. They will see it after signing in.</p>}
    </form>
  );
}
