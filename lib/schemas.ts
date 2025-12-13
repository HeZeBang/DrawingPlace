import { z } from "zod";

const CANVAS_WIDTH = parseInt(process.env.CANVAS_WIDTH || "1000", 10);
const CANVAS_HEIGHT = parseInt(process.env.CANVAS_HEIGHT || "1000", 10);

export const DrawDataSchema = z.object({
  x: z
    .number()
    .min(0)
    .max(CANVAS_WIDTH - 1),
  y: z
    .number()
    .min(0)
    .max(CANVAS_HEIGHT - 1),
  w: z.number().min(1).max(1),
  h: z.number().min(1).max(1),
  c: z
    .string()
    .min(7)
    .max(7)
    .regex(/^#[0-9a-fA-F]{6}$/), // color code like #ffffff
});

export const DrawRequestSchema = z.object({
  token: z.string().min(1),
  data: DrawDataSchema,
});

export type DrawRequest = z.infer<typeof DrawRequestSchema>;

export const ExchangeTokenRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type ExchangeTokenRequest = z.infer<typeof ExchangeTokenRequestSchema>;
