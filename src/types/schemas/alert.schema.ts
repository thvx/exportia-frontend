import { z } from 'zod';

export const AlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['sanitary', 'tariff', 'regulatory', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  isRead: z.boolean(),
  productId: z.string().optional(),
  marketId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateAlertSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['sanitary', 'tariff', 'regulatory', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  productId: z.string().optional(),
  marketId: z.string().optional(),
});

export const UpdateAlertSchema = CreateAlertSchema.partial();

export type AlertSchemaType = z.infer<typeof AlertSchema>;
export type CreateAlertSchemaType = z.infer<typeof CreateAlertSchema>;
