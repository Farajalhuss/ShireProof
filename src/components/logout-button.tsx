"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { secondaryButtonClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className={secondaryButtonClass}
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}
