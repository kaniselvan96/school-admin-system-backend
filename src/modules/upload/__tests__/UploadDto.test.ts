import { CsvItemSchema, CsvItemArraySchema } from '../UploadDto';

describe('CsvItemSchema', () => {
  const validRow = {
    teacherEmail: 'teacher1@gmail.com',
    teacherName: 'Teacher 1',
    studentEmail: 'student1@gmail.com',
    studentName: 'Student 1',
    classCode: 'P1-1',
    classname: 'P1 Integrity',
    subjectCode: 'MATHS',
    subjectName: 'Mathematics',
    toDelete: '0',
  };

  it('should pass for a valid CSV row', () => {
    const result = CsvItemSchema.safeParse(validRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validRow);
    }
  });

  it('should pass when toDelete is "1"', () => {
    const result = CsvItemSchema.safeParse({ ...validRow, toDelete: '1' });
    expect(result.success).toBe(true);
  });

  it('should fail when teacherEmail is empty', () => {
    const result = CsvItemSchema.safeParse({ ...validRow, teacherEmail: '' });
    expect(result.success).toBe(false);
  });

  it('should fail when teacherEmail is not a valid email', () => {
    const result = CsvItemSchema.safeParse({
      ...validRow,
      teacherEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when studentEmail is not a valid email', () => {
    const result = CsvItemSchema.safeParse({
      ...validRow,
      studentEmail: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when required string fields are missing', () => {
    const requiredFields = [
      'teacherEmail',
      'teacherName',
      'studentEmail',
      'studentName',
      'classCode',
      'classname',
      'subjectCode',
      'subjectName',
    ];

    for (const field of requiredFields) {
      const row = { ...validRow, [field]: '' };
      const result = CsvItemSchema.safeParse(row);
      expect(result.success).toBe(false);
    }
  });

  it('should fail when toDelete is not "0" or "1"', () => {
    const result = CsvItemSchema.safeParse({ ...validRow, toDelete: '2' });
    expect(result.success).toBe(false);
  });

  it('should fail when toDelete is a number instead of string', () => {
    const result = CsvItemSchema.safeParse({ ...validRow, toDelete: 0 });
    expect(result.success).toBe(false);
  });

  it('should fail when fields are missing entirely', () => {
    const result = CsvItemSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('CsvItemArraySchema', () => {
  const validRow = {
    teacherEmail: 'teacher1@gmail.com',
    teacherName: 'Teacher 1',
    studentEmail: 'student1@gmail.com',
    studentName: 'Student 1',
    classCode: 'P1-1',
    classname: 'P1 Integrity',
    subjectCode: 'MATHS',
    subjectName: 'Mathematics',
    toDelete: '0',
  };

  it('should pass for an array of valid rows', () => {
    const result = CsvItemArraySchema.safeParse([validRow, validRow]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it('should pass for an empty array', () => {
    const result = CsvItemArraySchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should fail if any row is invalid', () => {
    const invalidRow = { ...validRow, teacherEmail: '' };
    const result = CsvItemArraySchema.safeParse([validRow, invalidRow]);
    expect(result.success).toBe(false);
  });
});
