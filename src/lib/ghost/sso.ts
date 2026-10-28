import 'server-only';
import { SignJWT } from 'jose';

/**
 * Builds an authenticated Ghost SSO sign-in URL using signed JWT.
 * Ghost native member integration accepts this token and establishes a member session
 * directly on the Ghost domain without sending physical emails.
 */
export async function buildGhostSSOUrl(email: string, name: string): Promise<string> {
  const adminKey = process.env.GHOST_ADMIN_API_KEY;
  const ghostUrl = process.env.GHOST_URL?.replace(/\/$/, '') || 'https://blog.nutri-shift.com';

  if (!adminKey) {
    console.warn('[Ghost SSO] GHOST_ADMIN_API_KEY is not set. Returning fallback blog URL.');
    return ghostUrl;
  }

  // The Ghost Admin API key is structured as {id}:{secret}
  const parts = adminKey.split(':');
  const secretHex = parts.length === 2 ? parts[1] : adminKey;
  const secretBytes = Buffer.from(secretHex, 'hex');

  const token = await new SignJWT({
    sub: email.toLowerCase().trim(),
    name: name.trim(),
  })
    .setProtectedHeader({ alg: 'HS256', kid: parts[0] })
    .setIssuedAt()
    .setExpirationTime('5m') // Short 5-minute single-use validity
    .setAudience('ghost')
    .sign(secretBytes);

  const searchParams = new URLSearchParams({
    token,
    email: email.toLowerCase().trim(),
  });

  return `${ghostUrl}/members/api/send-magic-link/?${searchParams.toString()}`;
}
