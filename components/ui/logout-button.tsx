"use client";

import { logoutAction } from "@/features/auth/actions/auth.actions";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await logoutAction();
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={loading}
      className="w-full justify-start gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign out
    </Button>
  );
}