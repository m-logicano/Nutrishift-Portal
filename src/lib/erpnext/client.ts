import 'server-only';
import { z } from 'zod';
import { auth } from '@/auth';

export class ERPNextApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    public responseBody?: unknown
  ) {
    super(`ERPNext API Error [${status}] on ${endpoint}`);
    this.name = 'ERPNextApiError';
  }
}

interface ERPFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  tags?: string[];
  revalidate?: number | false;
  apiKey?: string;
  apiSecret?: string;
}

export async function erpFetch<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  options: ERPFetchOptions = {}
): Promise<T> {
  const {
    body,
    tags = [],
    revalidate = 300, // Safety fallback TTL (5 min), instant updates handled via on-demand webhook revalidateTag
    apiKey,
    apiSecret,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const baseUrl = process.env.ERPNEXT_URL?.replace(/\/$/, '') || 'https://erp.nutri-shift.com';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Resolve authorization credentials
  let authHeader = '';
  if (apiKey && apiSecret) {
    authHeader = `token ${apiKey}:${apiSecret}`;
  } else {
    // If not provided explicitly, try reading session or admin fallback
    const session = await auth();
    const sessionKey = (session as unknown as { erp_api_key?: string })?.erp_api_key;
    const sessionSecret = (session as unknown as { erp_api_secret?: string })?.erp_api_secret;

    if (sessionKey && sessionSecret) {
      authHeader = `token ${sessionKey}:${sessionSecret}`;
    } else if (process.env.ERPNEXT_ADMIN_API_KEY && process.env.ERPNEXT_ADMIN_API_SECRET) {
      authHeader = `token ${process.env.ERPNEXT_ADMIN_API_KEY}:${process.env.ERPNEXT_ADMIN_API_SECRET}`;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
    next: {
      tags,
      revalidate,
    },
  });

  // 401 Poison Pill strategy: Throw distinct error for session termination / redirect
  if (response.status === 401) {
    throw new ERPNextApiError(401, endpoint, 'UNAUTHORIZED_OR_REVOKED_SESSION');
  }

  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      errBody = await response.text();
    }
    throw new ERPNextApiError(response.status, endpoint, errBody);
  }

  const json = await response.json();
  const rawPayload = json.data !== undefined ? json.data : (json.message !== undefined ? json.message : json);

  // Validate response shape strictly with Zod
  const parseResult = schema.safeParse(rawPayload);
  if (!parseResult.success) {
    console.error(`[ERPNext Schema Mismatch] on ${endpoint}:`, parseResult.error.format());
    throw new Error(`Data validation failed for ERPNext endpoint: ${endpoint}`);
  }

  return parseResult.data;
}

export const erpnext = {
  get: <T>(endpoint: string, schema: z.ZodSchema<T>, options?: ERPFetchOptions) =>
    erpFetch<T>(endpoint, schema, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, schema: z.ZodSchema<T>, body: unknown, options?: ERPFetchOptions) =>
    erpFetch<T>(endpoint, schema, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, schema: z.ZodSchema<T>, body: unknown, options?: ERPFetchOptions) =>
    erpFetch<T>(endpoint, schema, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, schema: z.ZodSchema<T>, options?: ERPFetchOptions) =>
    erpFetch<T>(endpoint, schema, { ...options, method: 'DELETE' }),
};
