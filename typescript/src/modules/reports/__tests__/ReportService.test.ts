/// <reference types="jest" />

jest.mock('../../../shared/models', () => ({
  Teacher: { findAll: jest.fn() },
  ClassStudentTeacher: { findAll: jest.fn() },
  Subject: {},
}));

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

import { ReportService } from '../ReportService';
import { Teacher, ClassStudentTeacher } from '../../../shared/models';

const mockTeacher = Teacher as jest.Mocked<typeof Teacher>;
const mockClassStudentTeacher = ClassStudentTeacher as jest.Mocked<
  typeof ClassStudentTeacher
>;

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
    jest.clearAllMocks();
  });

  it('aggregates workload by teacher and subject with distinct class counts', async () => {
    (mockTeacher.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Teacher A' },
      { id: 2, name: 'Teacher B' },
    ]);
    (mockClassStudentTeacher.findAll as jest.Mock)
      .mockResolvedValueOnce([
        {
          classId: 1,
          subjectId: 10,
          Subject: { code: 'MATH', name: 'Mathematics' },
        },
        {
          classId: 2,
          subjectId: 10,
          Subject: { code: 'MATH', name: 'Mathematics' },
        },
        {
          classId: 2,
          subjectId: 10,
          Subject: { code: 'MATH', name: 'Mathematics' },
        },
        {
          classId: 3,
          subjectId: 11,
          Subject: { code: 'ENG', name: 'English' },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getTeacherWorkloadReport();

    expect(result).toEqual({
      'Teacher A': [
        {
          subjectCode: 'MATH',
          subjectName: 'Mathematics',
          numberOfClasses: 2,
        },
        {
          subjectCode: 'ENG',
          subjectName: 'English',
          numberOfClasses: 1,
        },
      ],
    });
  });

  it('skips assignments that have no subject data', async () => {
    (mockTeacher.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Teacher A' },
    ]);
    (mockClassStudentTeacher.findAll as jest.Mock).mockResolvedValue([
      { classId: 1, subjectId: 10, Subject: null },
    ]);

    const result = await service.getTeacherWorkloadReport();

    expect(result).toEqual({});
  });

  it('rethrows report generation failures', async () => {
    (mockTeacher.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(service.getTeacherWorkloadReport()).rejects.toThrow(
      'DB error',
    );
  });
});
