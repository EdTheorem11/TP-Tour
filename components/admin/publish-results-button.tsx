"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishEventResults } from "@/lib/actions/admin-scoring";

export function PublishResultsButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="gold"
      size="lg"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            "Publishing results will update player statistics and the TP Tour Order of Merit. Continue?",
          )
        ) {
          startTransition(async () => {
            await publishEventResults(eventId);
            router.refresh();
          });
        }
      }}
    >
      {pending ? "Publishing…" : "Publish Results"}
    </Button>
  );
}
