"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishEventResults } from "@/lib/actions/admin-scoring";

export function PublishResultsButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const publish = (sendEmails: boolean, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      await publishEventResults(eventId, sendEmails);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="gold"
        size="lg"
        disabled={pending}
        onClick={() =>
          publish(
            true,
            "Publishing results will update player statistics and the TP Tour Order of Merit, and email every player their result. Continue?",
          )
        }
      >
        {pending ? "Publishing…" : "Publish & Email"}
      </Button>
      <Button
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() =>
          publish(
            false,
            "This will publish results on TP Tour and update the Order of Merit, without emailing players. Continue?",
          )
        }
      >
        {pending ? "Publishing…" : "Just Publish (No Email)"}
      </Button>
    </div>
  );
}
