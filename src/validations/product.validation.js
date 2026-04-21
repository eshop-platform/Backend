import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z.number().positive("Price must be positive"),
  description: z.string().optional(),
  image: z.string().optional(),
  category: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
});