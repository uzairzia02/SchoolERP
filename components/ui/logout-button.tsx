"use client";

import { logoutAction } from "@/features/auth/actions/auth.actions";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    // 🔥 SABSE IMPORTANT: Browser history destroy karo
    if (typeof window !== "undefined") {
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Destroy history — back button dabane par kuch nahi milega
      window.history.pushState(null, "", "/login?loggedOut=true");
      window.history.pushState(null, "", "/login?loggedOut=true");
      window.history.pushState(null, "", "/login?loggedOut=true");
      
      // Replace current state
      window.history.replaceState(null, "", "/login?loggedOut=true");
    }

    // Client-side signOut — cookies clear
    await signOut({ redirect: false });
    
    // Server-side logout
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