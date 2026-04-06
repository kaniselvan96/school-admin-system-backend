import { z } from 'zod';

export const UpdateClassParamsSchema = z.object({
  classCode: z.string().min(1, 'classCode is required'),
});

export const UpdateClassBodySchema = z.object({
  className: z.string().min(1, 'className is required'),
});

export type UpdateClassParams = z.infer<typeof UpdateClassParamsSchema>;
export type UpdateClassBody = z.infer<typeof UpdateClassBodySchema>;
