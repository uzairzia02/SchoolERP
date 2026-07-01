export const APP_CONFIG = {
  name: "ScholarSync ERP",
  shortName: "ScholarSync",
  description: "Modern School Management System",
  version: "1.0.0",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: "support@scholarsync.com",

  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },

  upload: {
    maxFileSizeMB: 10,
    acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
    acceptedDocTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },

  dateFormat: "dd MMM yyyy",
  dateTimeFormat: "dd MMM yyyy, hh:mm a",
  timeFormat: "hh:mm a",
} as const;