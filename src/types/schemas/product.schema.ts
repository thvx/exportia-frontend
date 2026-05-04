import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  hsCode: z.string().optional(),
  category: z.string().optional(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es requerido'),
  description: z.string().optional(),
  hsCode: z.string().optional(),
  category: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type ProductSchemaType = z.infer<typeof ProductSchema>;
export type CreateProductSchemaType = z.infer<typeof CreateProductSchema>;
