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

export const ExternalStudentSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

export const ExternalStudentsResponseSchema = z.object({
  count: z.number(),
  students: z.array(ExternalStudentSchema),
});

export const StudentItemSchema = ExternalStudentSchema.extend({
  isExternal: z.boolean(),
});

export type GetStudentsParams = z.infer<typeof GetStudentsParamsSchema>;
export type GetStudentsQuery = z.infer<typeof GetStudentsQuerySchema>;
export type ExternalStudent = z.infer<typeof ExternalStudentSchema>;
export type StudentItem = z.infer<typeof StudentItemSchema>;
export type ExternalStudentsResponse = z.infer<
  typeof ExternalStudentsResponseSchema
>;
