import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user) throw new UploadThingError("Unauthorized");
  return session.user;
}

export const ourFileRouter = {
  // For assignment attachments (teacher) and submissions (student)
  assignmentAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      const user = await getAuthenticatedUser();
      return { userId: user.id, schoolId: user.schoolId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Assignment attachment uploaded:", file.url, "by", metadata.userId);
      return { url: file.url, name: file.name };
    }),
  examAttachment: f({
  image: { maxFileSize: "8MB", maxFileCount: 5 },
  pdf: { maxFileSize: "16MB", maxFileCount: 5 },
  "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    maxFileSize: "16MB",
    maxFileCount: 5,
  },
})
  .middleware(async () => {
    const user = await getAuthenticatedUser();
    return { userId: user.id, schoolId: user.schoolId };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Exam attachment uploaded:", file.url, "by", metadata.userId);
    return { url: file.url, name: file.name };
  }),

  // Generic images (avatars, gallery, etc.) — reusable later
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getAuthenticatedUser();
      return { userId: user.id, schoolId: user.schoolId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;