"use client";

import { useRouter } from "next/navigation";

/**
 * Small floating control shown only in Draft Mode so the editor can exit
 * preview. Calls the disable route then refreshes.
 */
export function DisableDraftMode() {
  const router = useRouter();

  return (
    <a
      href="/api/draft-mode/disable"
      onClick={(e) => {
        e.preventDefault();
        fetch("/api/draft-mode/disable").then(() => router.refresh());
      }}
      className="fixed bottom-4 left-4 z-50 rounded-[var(--radius-full)] bg-fg px-4 py-2 text-[var(--step--1)] font-medium text-bg shadow-[var(--shadow-md)]"
    >
      Exit preview
    </a>
  );
}
