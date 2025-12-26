import { z } from "zod";

export const DrawDataSchema = z.object({
  x: z.number().min(0).int(),
  y: z.number().min(0).int(),
  w: z.number().min(1).max(1).optional().default(1),
  h: z.number().min(1).max(1).optional().default(1),
  c: z
    .string()
    .min(7)
    .max(7)
    .regex(/^#[0-9a-fA-F]{6}$/), // color code like #ffffff
});

export const PlaceV2PointsSchema = z
  .object({
    points: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        c: z.string(),
      }),
    ),
    colors: z.array(z.string()),
    delay: z.number(),
    actionCount: z.number().optional(),
  })
  .optional();

export const PlaceResponseSchema = z.object({
  status: z.boolean(),
  data: PlaceV2PointsSchema,
  error: z.string().optional(),
});

export const DrawRequestSchema = z.object({
  token: z.string().optional(),
  data: DrawDataSchema,
});

export type DrawRequest = z.infer<typeof DrawRequestSchema>;

export const ExchangeTokenRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type ExchangeTokenRequest = z.infer<typeof ExchangeTokenRequestSchema>;
