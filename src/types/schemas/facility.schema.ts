import { z } from 'zod';

export const FacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['logistics', 'customs', 'certification', 'financing', 'other']),
  description: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional(),
  contact: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateFacilitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['logistics', 'customs', 'certification', 'financing', 'other']),
  description: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  contact: z.string().optional(),
});

export const UpdateFacilitySchema = CreateFacilitySchema.partial();

export type FacilitySchemaType = z.infer<typeof FacilitySchema>;
export type CreateFacilitySchemaType = z.infer<typeof CreateFacilitySchema>;
