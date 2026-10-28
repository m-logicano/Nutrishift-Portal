import { z } from 'zod';

export const GhostMemberSchema = z.object({
  id: z.string(),
  uuid: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  status: z.enum(['free', 'paid', 'comped']).default('free'),
  labels: z.array(z.union([z.string(), z.object({ name: z.string() })])).default([]),
});

export type GhostMember = z.infer<typeof GhostMemberSchema>;

export const GhostPostSchema = z.object({
  id: z.string(),
  uuid: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  html: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  feature_image: z.string().optional().nullable(),
  visibility: z.enum(['public', 'members', 'paid', 'tiers']).default('public'),
  published_at: z.string().optional().nullable(),
});

export type GhostPost = z.infer<typeof GhostPostSchema>;
