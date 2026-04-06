import { z } from 'zod';

export const GetStudentsParamsSchema = z.object({
  classCode: z.string().min(1, 'classCode is required'),
});

export const GetStudentsQuerySchema = z.object({
  offset: z
    .string()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val >= 0,
      'offset must be a non-negative number',
    ),
  limit: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'limit must be a positive number'),
});

export type GetStudentsParams = z.infer<typeof GetStudentsParamsSchema>;
export type GetStudentsQuery = z.infer<typeof GetStudentsQuerySchema>;
