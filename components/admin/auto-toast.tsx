"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/admin/toast";

export function AutoToast({
  message,
  variant,
  cleanHref,
}: {
  message: string;
  variant: "success" | "error";
  cleanHref: string;
}) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  if (!visible) return null;

  return (
    <Toast
      message={message}
      variant={variant}
      onDismiss={() => {
        setVisible(false);
        router.replace(cleanHref);
      }}
    />
  );
}
