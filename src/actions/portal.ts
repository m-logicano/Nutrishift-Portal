'use server';

import { auth } from '@/auth';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { recordPatientVitalSigns } from '@/lib/erpnext/services';

const MeasurementFormSchema = z.object({
  weight: z.coerce.number().positive('Please enter a valid positive weight in kg'),
  height: z.coerce.number().positive().optional().nullable(),
  upperWaist: z.coerce.number().optional().nullable(),
  lowerWaist: z.coerce.number().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function submitMeasurementAction(formData: FormData) {
  const session = await auth();

  const patientId = (session?.user as unknown as { patient_id?: string })?.patient_id;
  if (!patientId) {
    return { success: false, error: 'Unauthorized: Patient ID not associated with current session.' };
  }

  const raw = {
    weight: formData.get('weight'),
    height: formData.get('height'),
    upperWaist: formData.get('upperWaist'),
    lowerWaist: formData.get('lowerWaist'),
    notes: formData.get('notes'),
  };

  const parsed = MeasurementFormSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const doc = await recordPatientVitalSigns({
      patientId,
      weight: parsed.data.weight,
      height: parsed.data.height || undefined,
      upperWaist: parsed.data.upperWaist || undefined,
      lowerWaist: parsed.data.lowerWaist || undefined,
      notes: parsed.data.notes || undefined,
    });

    // Invalidate patient cache immediately on-demand
    revalidateTag(`patient-${patientId}`, { expire: 0 });
    revalidateTag('doctype-vital_signs', { expire: 0 });

    return {
      success: true,
      message: 'Measurement recorded successfully into your clinical chart!',
      data: doc,
    };
  } catch (err: unknown) {
    console.error('[Measurement Action Error]:', err);
    return {
      success: false,
      error: 'Failed to record measurement to ERPNext. Please verify server connection.',
    };
  }
}
