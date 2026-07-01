export const MESSAGES = {
  auth: {
    invalidCredentials: "Invalid email or password.",
    sessionExpired: "Your session has expired. Please log in again.",
    unauthorized: "You are not authorized to perform this action.",
    forbidden: "Access denied.",
    schoolInactive: "Your school account is inactive. Contact support.",
  },
  common: {
    created: (entity: string) => `${entity} created successfully.`,
    updated: (entity: string) => `${entity} updated successfully.`,
    deleted: (entity: string) => `${entity} deleted successfully.`,
    notFound: (entity: string) => `${entity} not found.`,
    error: "Something went wrong. Please try again.",
    serverError: "Internal server error. Please try again later.",
    validationError: "Please fix the errors below.",
  },
  student: {
    admissionNumberExists: "Admission number already exists.",
  },
  fee: {
    alreadyPaid: "This fee has already been paid in full.",
    overpayment: "Payment amount exceeds the due amount.",
  },
  leave: {
    conflictingDates: "You already have a leave request for these dates.",
  },
} as const;