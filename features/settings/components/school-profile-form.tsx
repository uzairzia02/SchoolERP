"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";
import { z } from "zod";
import { updateSchoolProfileAction } from "@/features/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  zipCode: z.string().min(1, "Required"),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SchoolProfileFormProps {
  school: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    website: string | null;
    code: string;
    logo: string | null;
  };
}

export function SchoolProfileForm({ school }: SchoolProfileFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      zipCode: school.zipCode,
      website: school.website ?? "",
    },
  });

  async function onSubmit(values: FormData) {
    const result = await updateSchoolProfileAction(values);
    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FormData, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* School Code (read-only) */}
      <div className="rounded-xl border bg-muted/20 p-4 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">School Code</p>
          <p className="text-sm font-mono font-bold">{school.code}</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>School Name *</Label>
            <Input
              {...register("name")}
              placeholder="Greenwood International School"
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" {...register("email")} className={cn(errors.email && "border-destructive")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Phone *</Label>
            <Input {...register("phone")} placeholder="+92-21-1234567" className={cn(errors.phone && "border-destructive")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Website</Label>
            <Input {...register("website")} placeholder="https://school.edu.pk" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Street Address *</Label>
            <Input {...register("address")} placeholder="123 Education Avenue" className={cn(errors.address && "border-destructive")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>City *</Label>
            <Input {...register("city")} placeholder="Karachi" className={cn(errors.city && "border-destructive")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>State/Province *</Label>
            <Input {...register("state")} placeholder="Sindh" className={cn(errors.state && "border-destructive")} />
            {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Country *</Label>
            <Input {...register("country")} placeholder="Pakistan" className={cn(errors.country && "border-destructive")} />
            {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>ZIP Code *</Label>
            <Input {...register("zipCode")} placeholder="75500" className={cn(errors.zipCode && "border-destructive")} />
            {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}