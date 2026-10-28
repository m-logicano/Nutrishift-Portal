import 'server-only';
import { SignJWT } from 'jose';
import { GhostMember, GhostMemberSchema } from './types';

/**
 * Creates short-lived Ghost Admin API JWT token for server-side management
 */
async function getGhostAdminToken(): Promise<string> {
  const adminKey = process.env.GHOST_ADMIN_API_KEY;
  if (!adminKey || !adminKey.includes(':')) {
    throw new Error('Valid GHOST_ADMIN_API_KEY (id:secret) is required.');
  }

  const [id, secretHex] = adminKey.split(':');
  const secretBytes = Buffer.from(secretHex, 'hex');

  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', kid: id, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('/admin/')
    .sign(secretBytes);
}

/**
 * Idempotently finds an existing Ghost member by email or provisions a new one.
 */
export async function findOrCreateGhostMember(data: {
  email: string;
  name?: string;
  note?: string;
  labels?: string[];
}): Promise<GhostMember | null> {
  const ghostUrl = process.env.GHOST_URL?.replace(/\/$/, '') || 'https://blog.nutri-shift.com';
  const cleanEmail = data.email.toLowerCase().trim();

  try {
    const token = await getGhostAdminToken();

    // 1. Check existing member
    const searchRes = await fetch(
      `${ghostUrl}/ghost/api/admin/members/?filter=email:${encodeURIComponent(cleanEmail)}`,
      {
        headers: {
          Authorization: `Ghost ${token}`,
          'Accept-Version': 'v5.0',
        },
        cache: 'no-store',
      }
    );

    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      if (searchJson.members && searchJson.members.length > 0) {
        return GhostMemberSchema.parse(searchJson.members[0]);
      }
    }

    // 2. Create new member if not found
    const createRes = await fetch(`${ghostUrl}/ghost/api/admin/members/`, {
      method: 'POST',
      headers: {
        Authorization: `Ghost ${token}`,
        'Content-Type': 'application/json',
        'Accept-Version': 'v5.0',
      },
      body: JSON.stringify({
        members: [
          {
            email: cleanEmail,
            name: data.name || cleanEmail.split('@')[0],
            note: data.note || 'Synced from Nutrishift Portal',
            labels: data.labels || ['Portal-User'],
          },
        ],
      }),
      cache: 'no-store',
    });

    if (createRes.ok) {
      const createJson = await createRes.json();
      if (createJson.members && createJson.members.length > 0) {
        return GhostMemberSchema.parse(createJson.members[0]);
      }
    }

    console.warn(`[Ghost Admin] Member creation returned status ${createRes.status}`);
    return null;
  } catch (err) {
    console.error('[Ghost Admin] Error in findOrCreateGhostMember:', err);
    return null;
  }
}
