import type { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Generic API Response Wrapper
// ─────────────────────────────────────────────────────────────

export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────────────────────────────────────────────────────────
// Server Action Result
// ─────────────────────────────────────────────────────────────

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─────────────────────────────────────────────────────────────
// Session Context
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
}

// ─────────────────────────────────────────────────────────────
// Sidebar Navigation
// ─────────────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}