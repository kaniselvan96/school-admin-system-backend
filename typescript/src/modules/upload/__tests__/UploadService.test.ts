import { UploadService } from '../UploadService';
import { CsvItemDto } from '../UploadDto';

// Mock all Sequelize models
jest.mock('../../../shared/models', () => ({
  Teacher: { bulkCreate: jest.fn(), findOne: jest.fn() },
  Student: { bulkCreate: jest.fn(), findOne: jest.fn() },
  Subject: { bulkCreate: jest.fn(), findOne: jest.fn() },
  Class: { upsert: jest.fn(), findOne: jest.fn() },
  ClassStudentTeacher: { findOrCreate: jest.fn() },
}));

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

import {
  Teacher,
  Student,
  Subject,
  Class,
  ClassStudentTeacher,
} from '../../../shared/models';

const mockTeacher = Teacher as jest.Mocked<typeof Teacher>;
const mockStudent = Student as jest.Mocked<typeof Student>;
const mockSubject = Subject as jest.Mocked<typeof Subject>;
const mockClass = Class as jest.Mocked<typeof Class>;
const mockCST = ClassStudentTeacher as jest.Mocked<typeof ClassStudentTeacher>;

describe('UploadService', () => {
  let uploadService: UploadService;

  const validRow: CsvItemDto = {
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

  beforeEach(() => {
    uploadService = new UploadService();
    jest.clearAllMocks();
  });

  describe('processCsvData', () => {
    it('should upsert teachers, students, subjects, classes and relationships', async () => {
      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCST.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await uploadService.processCsvData([validRow]);

      expect(mockTeacher.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockStudent.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockSubject.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockClass.upsert).toHaveBeenCalledTimes(1);
      expect(mockCST.findOrCreate).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate teachers by email', async () => {
      const row2: CsvItemDto = {
        ...validRow,
        studentEmail: 'student2@gmail.com',
        studentName: 'Student 2',
      };

      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCST.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await uploadService.processCsvData([validRow, row2]);

      // bulkCreate called once with 1 teacher (deduped)
      const teacherData = (mockTeacher.bulkCreate as jest.Mock).mock
        .calls[0][0];
      expect(teacherData).toHaveLength(1);
      expect(teacherData[0].email).toBe('teacher1@gmail.com');
    });

    it('should deduplicate students by email', async () => {
      const row2: CsvItemDto = {
        ...validRow,
        teacherEmail: 'teacher2@gmail.com',
        teacherName: 'Teacher 2',
      };

      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCST.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await uploadService.processCsvData([validRow, row2]);

      const studentData = (mockStudent.bulkCreate as jest.Mock).mock
        .calls[0][0];
      expect(studentData).toHaveLength(1);
      expect(studentData[0].email).toBe('student1@gmail.com');
    });

    it('should keep latest values for duplicate keys', async () => {
      const latestRow: CsvItemDto = {
        ...validRow,
        teacherName: 'Teacher 1 Updated',
        studentName: 'Student 1 Updated',
        subjectName: 'Maths Updated',
        classname: 'P1 Integrity Updated',
        toDelete: '1',
      };

      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCST.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await uploadService.processCsvData([validRow, latestRow]);

      const teacherData = (mockTeacher.bulkCreate as jest.Mock).mock
        .calls[0][0];
      expect(teacherData).toHaveLength(1);
      expect(teacherData[0].name).toBe('Teacher 1 Updated');

      const studentData = (mockStudent.bulkCreate as jest.Mock).mock
        .calls[0][0];
      expect(studentData).toHaveLength(1);
      expect(studentData[0].name).toBe('Student 1 Updated');
      expect(studentData[0].toDelete).toBe(1);

      const subjectData = (mockSubject.bulkCreate as jest.Mock).mock
        .calls[0][0];
      expect(subjectData).toHaveLength(1);
      expect(subjectData[0].name).toBe('Maths Updated');

      const classUpsertPayload = (mockClass.upsert as jest.Mock).mock
        .calls[0][0];
      expect(classUpsertPayload.name).toBe('P1 Integrity Updated');
    });

    it('should set toDelete to 1 when csv value is "1"', async () => {
      const deleteRow: CsvItemDto = { ...validRow, toDelete: '1' };

      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCST.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await uploadService.processCsvData([deleteRow]);

      const studentData = (mockStudent.bulkCreate as jest.Mock).mock
        .calls[0][0];
      expect(studentData[0].toDelete).toBe(1);
    });

    it('should skip class upsert if subject not found', async () => {
      (mockSubject.findOne as jest.Mock).mockResolvedValue(null);
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await uploadService.processCsvData([validRow]);

      expect(mockClass.upsert).not.toHaveBeenCalled();
    });

    it('should skip relationship if teacher not found', async () => {
      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue(null);

      await uploadService.processCsvData([validRow]);

      expect(mockCST.findOrCreate).not.toHaveBeenCalled();
    });

    it('should skip relationship if student not found', async () => {
      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue(null);

      await uploadService.processCsvData([validRow]);

      expect(mockCST.findOrCreate).not.toHaveBeenCalled();
    });

    it('should handle empty csv data', async () => {
      await uploadService.processCsvData([]);

      expect(mockTeacher.bulkCreate).not.toHaveBeenCalled();
      expect(mockStudent.bulkCreate).not.toHaveBeenCalled();
    });

    it('should replace class when student takes same subject in different class', async () => {
      const row1: CsvItemDto = { ...validRow };
      const row2: CsvItemDto = {
        ...validRow,
        classCode: 'P2-2',
        classname: 'P2 Creative',
        teacherEmail: 'teacher2@gmail.com',
        teacherName: 'Teacher 2',
      };

      (mockSubject.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockClass.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockTeacher.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockStudent.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCST.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

      await uploadService.processCsvData([row1, row2]);

      // Only the second class link should remain (row1 link removed)
      expect(mockCST.findOrCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw if bulkCreate fails', async () => {
      (mockTeacher.bulkCreate as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );

      await expect(uploadService.processCsvData([validRow])).rejects.toThrow(
        'DB error',
      );
    });
  });
});
