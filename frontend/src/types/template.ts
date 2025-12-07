// Template entity
export interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

// User's selected template preference
export interface UserTemplatePreference {
  userId: number;
  templateId: number;
  templateName: string;
}

// Template variable definition
export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    name: "fullName",
    description: "Customer full name",
    example: "John Doe",
  },
  {
    name: "serviceName",
    description: "Service name",
    example: "Haircut & Styling",
  },
  {
    name: "date",
    description: "Appointment date",
    example: "Monday, December 25, 2024",
  },
  {
    name: "startTime",
    description: "Appointment start time",
    example: "10:00 AM",
  },
  {
    name: "endTime",
    description: "Appointment end time",
    example: "11:00 AM",
  },
  {
    name: "year",
    description: "Current year",
    example: "2024",
  },
];

// Create template data
export interface CreateTemplateData {
  name: string;
  subject: string;
  body: string;
}

// Update template data
export interface UpdateTemplateData {
  name?: string;
  subject?: string;
  body?: string;
}

// Template types available in backend (predefined/seeded templates)
export type TemplateName =
  | "booking-confirmation-classic"
  | "booking-confirmation-modern"
  | "booking-confirmation-elegant"
  | "booking-confirmation-simple";

// Template selection data (for user to choose preferred template)
export interface SelectTemplateData {
  templateId: number;
}

// Template list response (for template selection page)
export interface TemplateListResponse {
  templates: Template[];
  selectedTemplateId?: number; // Currently selected template for the user
}
