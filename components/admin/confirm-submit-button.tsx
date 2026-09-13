"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  children,
  confirmText,
}: {
  children: React.ReactNode;
  confirmText: string;
}) {
  return (
    <Button
      type="submit"
      variant="gold"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
