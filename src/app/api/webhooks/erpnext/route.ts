import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Webhook handler for ERPNext / Frappe DocType events.
 * Triggered automatically by ERPNext Webhooks on Patient, Diet Plan, Appointment updates.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-erpnext-secret');
    const webhookSecret = process.env.ERPNEXT_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    const payload = await req.json();
    const { doctype, docname, patient_id } = payload || {};

    // Revalidate specific patient tag if available
    const targetPatient = patient_id || (doctype === 'Patient' ? docname : null);
    if (targetPatient) {
      revalidateTag(`patient-${targetPatient}`, { expire: 0 });
    }

    // Revalidate general doctype tag
    if (doctype) {
      revalidateTag(`doctype-${doctype.toLowerCase()}`, { expire: 0 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully revalidated tags for ${doctype || 'resource'} ${docname || ''}`,
    });
  } catch (err) {
    console.error('[ERPNext Webhook Error]:', err);
    return NextResponse.json({ error: 'Failed to process ERPNext webhook' }, { status: 500 });
  }
}
