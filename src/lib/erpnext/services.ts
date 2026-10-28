import 'server-only';
import { z } from 'zod';
import { erpnext } from './client';
import {
  PatientDoc,
  PatientDocSchema,
  AppointmentDoc,
  AppointmentDocSchema,
  VitalSignsDoc,
  VitalSignsDocSchema,
  ClinicalFile,
  ClinicalFileSchema,
} from './types';

/**
 * Retrieves the Patient record by patient ID (e.g. PAT-0001)
 */
export async function getPatientProfile(patientId: string): Promise<PatientDoc | null> {
  if (!patientId) return null;

  try {
    return await erpnext.get<PatientDoc>(
      `/api/resource/Patient/${encodeURIComponent(patientId)}`,
      PatientDocSchema,
      {
        tags: [`patient-${patientId}`],
        revalidate: 300,
      }
    );
  } catch (err) {
    console.warn(`[ERPNext Services] Patient profile fetch error for ${patientId}:`, err);
    return null;
  }
}

/**
 * Retrieves scheduled appointments or encounters for a patient
 */
export async function getPatientAppointments(patientId: string): Promise<AppointmentDoc[]> {
  if (!patientId) return [];

  const appointmentListSchema = z.array(AppointmentDocSchema);

  try {
    // 1. Try Patient Appointment doctype
    const appointments = await erpnext.get<AppointmentDoc[]>(
      `/api/resource/Patient Appointment?filters=[["patient","=","${encodeURIComponent(patientId)}"]]&fields=["name","patient","patient_name","appointment_date","appointment_time","practitioner_name","status","notes"]&order_by=appointment_date desc`,
      appointmentListSchema,
      {
        tags: [`patient-${patientId}`, 'doctype-appointment'],
        revalidate: 300,
      }
    );

    if (appointments && appointments.length > 0) {
      return appointments;
    }

    // 2. Fallback to Patient Encounter doctype if Marley HMS uses encounters
    return await erpnext.get<AppointmentDoc[]>(
      `/api/resource/Patient Encounter?filters=[["patient","=","${encodeURIComponent(patientId)}"]]&fields=["name","patient","encounter_date","encounter_time","practitioner_name","status","google_meet_link","clinical_notes"]&order_by=encounter_date desc`,
      appointmentListSchema,
      {
        tags: [`patient-${patientId}`, 'doctype-encounter'],
        revalidate: 300,
      }
    );
  } catch (err) {
    console.warn(`[ERPNext Services] Appointments fetch error for ${patientId}:`, err);
    return [];
  }
}

/**
 * Retrieves patient vital signs history (weights, BMI, measurements)
 */
export async function getPatientVitalSigns(patientId: string): Promise<VitalSignsDoc[]> {
  if (!patientId) return [];

  const vitalsListSchema = z.array(VitalSignsDocSchema);

  try {
    return await erpnext.get<VitalSignsDoc[]>(
      `/api/resource/Vital Signs?filters=[["patient","=","${encodeURIComponent(patientId)}"]]&fields=["name","patient","signs_date","signs_time","weight","height","bmi","upper_waist","lower_waist","waist_to_height_ratio","bmi_class","body_mass_classification","vital_signs_note","nutrition_note","creation"]&order_by=signs_date desc,creation desc&limit_page_length=20`,
      vitalsListSchema,
      {
        tags: [`patient-${patientId}`, 'doctype-vital_signs'],
        revalidate: 300,
      }
    );
  } catch (err) {
    console.warn(`[ERPNext Services] Vital signs fetch error for ${patientId}:`, err);
    return [];
  }
}

/**
 * Retrieves attached clinical diet plan files, lab results, and documents
 */
export async function getPatientFiles(patientId: string): Promise<ClinicalFile[]> {
  if (!patientId) return [];

  const fileListSchema = z.array(ClinicalFileSchema);

  try {
    return await erpnext.get<ClinicalFile[]>(
      `/api/resource/File?filters=[["attached_to_name","=","${encodeURIComponent(patientId)}"],["attached_to_doctype","=","Patient"]]&fields=["name","file_name","file_url","creation"]&order_by=creation desc`,
      fileListSchema,
      {
        tags: [`patient-${patientId}`, 'doctype-file'],
        revalidate: 300,
      }
    );
  } catch (err) {
    console.warn(`[ERPNext Services] Clinical files fetch error for ${patientId}:`, err);
    return [];
  }
}

/**
 * Records a new measurement in ERPNext Vital Signs and calculates BMI
 */
export async function recordPatientVitalSigns(data: {
  patientId: string;
  weight: number;
  height?: number;
  upperWaist?: number | string;
  lowerWaist?: number | string;
  notes?: string;
}): Promise<VitalSignsDoc> {
  const { patientId, weight, height, upperWaist, lowerWaist, notes } = data;

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];

  let bmi: number | null = null;
  if (height && height > 0 && weight > 0) {
    const heightInMeters = height / 100;
    bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  const payload: Record<string, unknown> = {
    patient: patientId,
    signs_date: today,
    signs_time: now,
    weight,
    height: height || null,
    bmi: bmi || null,
    upper_waist: upperWaist || null,
    lower_waist: lowerWaist || null,
    vital_signs_note: notes || 'Recorded via Nutrishift Portal',
  };

  return erpnext.post<VitalSignsDoc>(
    '/api/resource/Vital Signs',
    VitalSignsDocSchema,
    payload
  );
}
