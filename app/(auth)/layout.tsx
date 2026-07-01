import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Login",
  description: `Sign in to ${APP_CONFIG.name}`,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display">
            {APP_CONFIG.name}
          </span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-display leading-tight">
              Empowering schools
              <br />
              with smarter tools.
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-sm">
              A complete school management platform built for modern education.
              Manage students, staff, fees, and more — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: "800+", label: "Students" },
              { value: "50+", label: "Teachers" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-4"
              >
                <div className="text-2xl font-bold font-display">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/60 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-display">
            {APP_CONFIG.name}
          </span>
        </div>

        <div className="w-full max-w-sm">{children}</div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Having trouble?{" "}
          <Link
            href={`mailto:${APP_CONFIG.supportEmail}`}
            className="text-primary hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}