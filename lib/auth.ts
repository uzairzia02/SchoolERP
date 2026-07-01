import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/config/auth.config";
import { loginSchema } from "@/lib/validations/auth.schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
            teacher: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
            employee: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
            parent: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
          },
        });

        if (!user || !user.isActive) return null;
        if (!user.school.isActive) return null;

        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) return null;

        // Update last login timestamp
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Build display name from the linked profile
        const profile =
          user.student ?? user.teacher ?? user.employee ?? user.parent;
        const name = profile
          ? `${profile.firstName} ${profile.lastName}`
          : user.email;
        const image = profile?.photo ?? null;

        return {
          id: user.id,
          email: user.email,
          name,
          image,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school.name,
          schoolCode: user.school.code,
        };
      },
    }),
  ],
});