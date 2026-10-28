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
  custom_subscription_tier: z.enum(['free', 'paid', 'admin']).default('free'),
});

export type PatientDoc = z.infer<typeof PatientDocSchema>;

// Appointment DocType Schema
export const AppointmentDocSchema = z.object({
  name: z.string(),
  patient: z.string(),
  patient_name: z.string().optional(),
  appointment_date: z.string(),
  appointment_time: z.string(),
  status: z.enum(['Scheduled', 'Open', 'Closed', 'Cancelled']).default('Scheduled'),
  practitioner: z.string().optional(),
  department: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export type AppointmentDoc = z.infer<typeof AppointmentDocSchema>;

// Diet Plan DocType Schema
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
  title: z.string().default('Diet Plan'),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  calories_target: z.number().optional().nullable(),
  meals: z.array(DietPlanMealSchema).default([]),
});

export type DietPlanDoc = z.infer<typeof DietPlanDocSchema>;

// Patient Measurements / Vital Signs Schema
export const VitalSignsDocSchema = z.object({
  name: z.string(),
  patient: z.string(),
  signs_date: z.string(),
  signs_time: z.string().optional(),
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  bp_systolic: z.number().optional().nullable(),
  bp_diastolic: z.number().optional().nullable(),
  pulse: z.number().optional().nullable(),
});

export type VitalSignsDoc = z.infer<typeof VitalSignsDocSchema>;
