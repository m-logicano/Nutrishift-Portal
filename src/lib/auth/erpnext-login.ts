import 'server-only';
import { NutriUser, UserRole } from './types';
import { findOrCreateGhostMember } from '@/lib/ghost/admin';

interface ERPLoginResponse {
  message?: string;
  home_page?: string;
  full_name?: string;
}

export async function loginWithERPNext(email: string, password: string): Promise<NutriUser | null> {
  const baseUrl = process.env.ERPNEXT_URL?.replace(/\/$/, '') || 'https://erpn.nutri-shift.com';
  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. Authenticate with Frappe / ERPNext
    const loginRes = await fetch(`${baseUrl}/api/method/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        usr: cleanEmail,
        pwd: password,
      }),
      cache: 'no-store',
    });

    if (!loginRes.ok) {
      console.warn(`[ERPNext Login] Auth failed for ${cleanEmail} (Status: ${loginRes.status})`);
      return null;
    }

    const loginData: ERPLoginResponse = await loginRes.json();
    const fullName = loginData.full_name || cleanEmail.split('@')[0];

    // Extract Frappe session cookie (sid) from Set-Cookie header if present
    const cookieHeader = loginRes.headers.get('set-cookie') || '';
    const sidMatch = cookieHeader.match(/sid=([^;]+)/);
    const sid = sidMatch ? sidMatch[1] : '';

    // 2. Fetch or resolve User & Patient details using admin API keys or session
    let role: UserRole = 'free';
    let patientId = '';
    let customerId = '';
    let apiKey = '';
    let apiSecret = '';

    const adminHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (process.env.ERPNEXT_ADMIN_API_KEY && process.env.ERPNEXT_ADMIN_API_SECRET) {
      adminHeaders['Authorization'] = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
    } else if (sid) {
      adminHeaders['Cookie'] = `sid=${sid}`;
    }

    // Lookup Patient record linked to this email
    try {
      const patientQuery = await fetch(
        `${baseUrl}/api/resource/Patient?filters=[["email","=","${encodeURIComponent(cleanEmail)}"]]&fields=["name","patient_name","customer","custom_subscription_tier"]`,
        { headers: adminHeaders, cache: 'no-store' }
      );

      if (patientQuery.ok) {
        const patientJson = await patientQuery.json();
        const records = patientJson.data || [];
        if (records.length > 0) {
          patientId = records[0].name;
          customerId = records[0].customer || '';
          const tier = records[0].custom_subscription_tier?.toLowerCase();
          if (tier === 'paid' || tier === 'premium' || tier === 'pro') {
            role = 'paid';
          } else if (tier === 'admin') {
            role = 'admin';
          }
        }
      }
    } catch (lookupErr) {
      console.warn('[ERPNext Login] Patient lookup warning:', lookupErr);
    }

    // 3. Auto-provision or link Ghost Member in background
    let ghostMemberId = '';
    try {
      const ghostMember = await findOrCreateGhostMember({
        email: cleanEmail,
        name: fullName,
        labels: [role === 'paid' ? 'Paid' : 'Free', 'Portal-Linked'],
      });
      if (ghostMember) {
        ghostMemberId = ghostMember.id;
      }
    } catch (ghostErr) {
      console.warn('[ERPNext Login] Ghost member link warning:', ghostErr);
    }

    return {
      id: cleanEmail,
      email: cleanEmail,
      name: fullName,
      role,
      patient_id: patientId,
      customer_id: customerId,
      erp_api_key: apiKey,
      erp_api_secret: apiSecret,
      ghost_member_id: ghostMemberId,
    };
  } catch (err) {
    console.error('[ERPNext Login] Unexpected error:', err);
    return null;
  }
}
