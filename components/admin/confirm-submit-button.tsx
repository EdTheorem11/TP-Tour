"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  children,
  confirmText,
  variant = "gold",
  size,
}: {
  children: React.ReactNode;
  confirmText: string;
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
