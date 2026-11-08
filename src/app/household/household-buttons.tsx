"use client";

import { useState, useTransition } from "react";
import { cancelInvite, leaveHousehold } from "@/lib/actions/household";

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-ghost btn-sm text-(--muted)"
      onClick={() => start(() => cancelInvite(inviteId).then(() => undefined))}
    >
      Remove
    </button>
  );
}

export function LeaveHouseholdButton() {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirming(true)}>
        Leave household
      </button>
    );
  }

  return (
    <div className="card space-y-3 p-4">
      <p className="text-[15px]">
        You will lose access to the recipes, pantry and lists in this household until someone invites you back.
      </p>
      {error && <p className="text-[14px] text-(--danger)">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary flex-1" onClick={() => setConfirming(false)}>
          Stay
        </button>
        <button
          type="button"
          disabled={pending}
          className="btn btn-danger flex-1"
          onClick={() =>
            start(async () => {
              const result = await leaveHousehold();
              if (result && !result.ok) setError(result.error);
            })
          }
        >
          {pending ? "Leaving" : "Leave"}
        </button>
      </div>
    </div>
  );
}
