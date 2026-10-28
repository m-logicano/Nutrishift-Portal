import { z } from 'zod';

// Base API Envelope
export const ERPNextEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    message: dataSchema.optional(),
  });

// Patient DocType Schema
export const PatientDocSchema = z.object({
  name: z.string(), // Patient ID (e.g. PAT-0001)
  patient_name: z.string().default(''),
  email: z.string().email().optional().nullable(),
  mobile: z.string().optional().nullable(),
  customer: z.string().optional().nullable(),
  sex: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  blood_group: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: z.string().default('Active'),
  primary_healthcare_practitioner: z.string().optional().nullable(),
  custom_subscription_tier: z.enum(['free', 'paid', 'admin']).default('free'),
  creation: z.string().optional(),
});

export type PatientDoc = z.infer<typeof PatientDocSchema>;

// Patient Appointment & Encounter Schema
export const AppointmentDocSchema = z.object({
  name: z.string(),
  patient: z.string(),
  patient_name: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  encounter_date: z.string().optional(),
  encounter_time: z.string().optional(),
  practitioner_name: z.string().optional().nullable(),
  status: z.string().default('Open'),
  google_meet_link: z.string().optional().nullable(),
  clinical_notes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AppointmentDoc = z.infer<typeof AppointmentDocSchema>;

// Vital Signs & Measurements Schema
export const VitalSignsDocSchema = z.object({
  name: z.string(),
  patient: z.string(),
  signs_date: z.string(),
  signs_time: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  upper_waist: z.union([z.number(), z.string()]).optional().nullable(),
  lower_waist: z.union([z.number(), z.string()]).optional().nullable(),
  waist_to_height_ratio: z.union([z.number(), z.string()]).optional().nullable(),
  bmi_class: z.string().optional().nullable(),
  body_mass_classification: z.string().optional().nullable(),
  vital_signs_note: z.string().optional().nullable(),
  nutrition_note: z.string().optional().nullable(),
  creation: z.string().optional(),
});

export type VitalSignsDoc = z.infer<typeof VitalSignsDocSchema>;

// Clinical File Attachment Schema (e.g. Diet Plan PDFs, Lab results)
export const ClinicalFileSchema = z.object({
  name: z.string(),
  file_name: z.string(),
  file_url: z.string(),
  creation: z.string().optional(),
});

export type ClinicalFile = z.infer<typeof ClinicalFileSchema>;

// Diet Plan Protocol Schema
export const DietPlanItemSchema = z.object({
  food_name: z.string(),
  quantity: z.number().default(1),
  unit: z.string().default('serving'),
  notes: z.string().optional().nullable(),
});

export const DietPlanMealSchema = z.object({
  meal_time: z.string(),
  items: z.array(DietPlanItemSchema).default([]),
});

export const DietPlanDocSchema = z.object({
  name: z.string(),
  patient: z.string(),
  title: z.string().default('Personalized Clinical Nutrition Plan'),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  calories_target: z.number().optional().nullable(),
  meals: z.array(DietPlanMealSchema).default([]),
});

export type DietPlanDoc = z.infer<typeof DietPlanDocSchema>;
