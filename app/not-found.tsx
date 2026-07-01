import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-bold font-display text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="max-w-sm text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}