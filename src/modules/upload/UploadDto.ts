import { z } from 'zod';

export const CsvItemSchema = z.object({
  teacherEmail: z
    .string()
    .min(1, 'teacherEmail is required')
    .email('teacherEmail must be a valid email'),
  teacherName: z.string().min(1, 'teacherName is required'),
  studentEmail: z
    .string()
    .min(1, 'studentEmail is required')
    .email('studentEmail must be a valid email'),
  studentName: z.string().min(1, 'studentName is required'),
  classCode: z.string().min(1, 'classCode is required'),
  classname: z.string().min(1, 'classname is required'),
  subjectCode: z.string().min(1, 'subjectCode is required'),
  subjectName: z.string().min(1, 'subjectName is required'),
  toDelete: z.enum(['0', '1'], {
    invalid_type_error: 'toDelete must be "0" or "1"',
  }),
});

export type CsvItemDto = z.infer<typeof CsvItemSchema>;

export const CsvItemArraySchema = z.array(CsvItemSchema);
