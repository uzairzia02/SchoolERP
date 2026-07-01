import type { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    schoolId: string;
    schoolName: string;
    schoolCode: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
      role: UserRole;
      schoolId: string;
      schoolName: string;
      schoolCode: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    schoolId: string;
    schoolName: string;
    schoolCode: string;
  }
}