"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { recalculateEventResults } from "@/lib/actions/admin-scoring";

export function RecalculateResultsButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          setDone(false);
          startTransition(async () => {
            await recalculateEventResults(eventId);
            setDone(true);
            router.refresh();
          });
        }}
      >
        {pending ? "Recalculating…" : "Recalculate Results"}
      </Button>
      {done && <p className="mt-2 text-xs text-tp-green-light">Results recalculated from the latest scores.</p>}
    </div>
  );
}
