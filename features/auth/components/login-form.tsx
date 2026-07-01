"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { loginSchema } from "@/lib/validations/auth.schema";
import { loginAction } from "@/features/auth/actions/auth.actions";
import type { LoginInput } from "@/types/auth.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    const result = await loginAction(values);

    if (!result.success) {
      // Map field errors back to the form
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof LoginInput, {
            message: messages[0],
          });
        });
        return;
      }

      toast.error(result.error);
      return;
    }

    toast.success("Welcome back!");
    router.push(result.data.redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold font-display tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@school.com"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              className={cn(
                "pr-10",
                errors.password && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </form>

      {/* Demo credentials hint — remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-dashed bg-muted/50 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Development credentials
          </p>
          <p className="text-xs text-muted-foreground">
            Run the seed script first, then use those credentials here.
          </p>
        </div>
      )}
    </div>
  );
}