import { z } from 'zod';
import { MEDIA_TYPES, VISIBILITIES } from '@vora/types';

export const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores are allowed')
  .transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  email: z.string().email(),
  username: usernameSchema,
  displayName: z.string().min(2).max(80),
  password: z.string().min(8).max(128),
  birthDate: z.string().datetime().optional(),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(3),
  password: z.string().min(8),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: z.string().max(280).nullable().optional(),
  about: z.string().max(6000).nullable().optional(),
  profession: z.string().max(120).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  languages: z.array(z.string().min(2).max(16)).max(12).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  links: z.array(z.object({ label: z.string().max(40), url: z.string().url() })).max(12).optional(),
  isIndexable: z.boolean().optional(),
  contactVisibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

export const mediaInputSchema = z.object({
  mediaType: z.enum(MEDIA_TYPES),
  storageKey: z.string().min(3),
  publicUrl: z.string().url(),
  thumbnailUrl: z.string().url().nullable().optional(),
  mimeType: z.string().min(3),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  duration: z.number().nonnegative().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).optional(),
});

export const createContentSchema = z.object({
  title: z.string().max(180).nullable().optional(),
  body: z.string().max(80000).nullable().optional(),
  visibility: z.enum(VISIBILITIES).default('PUBLIC'),
  language: z.string().min(2).max(16).default('tr'),
  originalLanguage: z.string().min(2).max(16).optional(),
  locationId: z.string().nullable().optional(),
  media: z.array(mediaInputSchema).max(12).default([]),
  saveAsDraft: z.boolean().default(false),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(3000),
  parentId: z.string().nullable().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  cursor: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  timeframe: z.enum(['24h', 'week', 'month']).optional(),
});

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(240),
  contentType: z.string().min(3).max(120),
  fileSize: z.number().int().positive().max(1024 * 1024 * 1024),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type MediaInput = z.infer<typeof mediaInputSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
