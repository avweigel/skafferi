"use client";

import { useState, useTransition } from "react";
import { acceptInvite } from "@/lib/actions/household";

export function AcceptInviteButton({ inviteId }: { inviteId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className="btn btn-primary btn-sm"
        onClick={() =>
          start(async () => {
            const result = await acceptInvite(inviteId);
            if (result && !result.ok) setError(result.error);
          })
        }
      >
        {pending ? "Joining" : "Accept"}
      </button>
      {error && <span className="text-[12px] text-(--danger)">{error}</span>}
    </div>
  );
}
