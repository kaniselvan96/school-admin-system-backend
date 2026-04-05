import { CsvItem } from 'CsvItem';
import {
  Teacher,
  Student,
  Class,
  Subject,
  ClassStudent,
  TeacherClass,
} from '../../shared/models';
import Logger from '../../shared/config/logger';

const LOG = new Logger('UploadService.js');

export class UploadService {
  private async upsertBatch<T>(
    model: any,
    data: Map<string, T>,
    fields: string[],
  ): Promise<void> {
    for (const item of data.values()) {
      await model.upsert(item, { fields });
    }
  }

  private parseCsv(csvData: CsvItem[]) {
    const teachers = new Map<string, { name: string; email: string }>();
    const students = new Map<
      string,
      { email: string; name: string; toDelete: 0 | 1 }
    >();
    const classes = new Map<
      string,
      {
        code: string;
        name: string;
        subjectCode: string;
      }
    >();
    const subjects = new Map<string, { code: string; name: string }>();
    const classStudentLinks = new Set<string>(); //class-student relationships
    const teacherClassLinks = new Set<string>(); //teacher-class relationships

    for (const item of csvData) {
      // Process teachers
      if (!teachers.has(item.teacherEmail)) {
        teachers.set(item.teacherEmail, {
          name: item.teacherName,
          email: item.teacherEmail,
        });
      }

      // Process students
      if (!students.has(item.studentEmail)) {
        students.set(item.studentEmail, {
          email: item.studentEmail,
          name: item.studentName,
          toDelete: Number(item.toDelete) === 1 ? 1 : 0,
        });
      }

      // Process subjects
      if (!subjects.has(item.subjectCode)) {
        subjects.set(item.subjectCode, {
          code: item.subjectCode,
          name: item.subjectName,
        });
      }

      // Process classes
      if (!classes.has(item.classCode)) {
        classes.set(item.classCode, {
          code: item.classCode,
          name: item.classname,
          subjectCode: item.subjectCode,
        });
      }

      // Track teacher-class relationships
      if (item.classCode && item.teacherEmail) {
        teacherClassLinks.add(`${item.teacherEmail}:${item.classCode}`);
      }

      // Track class-student relationships
      if (item.classCode && item.studentEmail) {
        classStudentLinks.add(`${item.classCode}:${item.studentEmail}`);
      }
    }
    return {
      teachers,
      students,
      classes,
      subjects,
      classStudentLinks,
      teacherClassLinks,
    };
  }

  async processCsvData(csvData: CsvItem[]): Promise<void> {
    try {
      const parsedData = this.parseCsv(csvData);

      LOG.info(`Upserting ${parsedData.teachers.size} teachers...`);
      await this.upsertBatch(Teacher, parsedData.teachers, ['email']);

      LOG.info(`Upserting ${parsedData.students.size} students...`);
      await this.upsertBatch(Student, parsedData.students, ['email']);

      LOG.info(`Upserting ${parsedData.subjects.size} subjects...`);
      await this.upsertBatch(Subject, parsedData.subjects, ['code']);

      // Upsert classes with subject associations
      for (const classData of parsedData.classes.values()) {
        const subject = await Subject.findOne({
          where: { code: classData.subjectCode },
        });

        if (!subject) {
          LOG.warn(`Subject not found for code: ${classData.subjectCode}`);
          continue;
        }

        LOG.info(`Upserting class with code: ${classData.code}...`);
        await Class.upsert(
          {
            code: classData.code,
            name: classData.name,
            subjectId: subject.id,
          },
          { fields: ['code'] },
        );
      }

      // Create teacher-class relationships
      for (const link of parsedData.teacherClassLinks) {
        const [teacherEmail, classCode] = link.split(':');
        const teacher = await Teacher.findOne({
          where: { email: teacherEmail },
        });
        const classInstance = await Class.findOne({
          where: { code: classCode },
        });

        if (!teacher) {
          LOG.warn(`Teacher not found for email: ${teacherEmail}`);
        }
        if (!classInstance) {
          LOG.warn(`Class not found for code: ${classCode}`);
        }

        if (teacher && classInstance) {
          LOG.info(
            `Creating teacher-class relationship for teacher: ${teacherEmail} and class: ${classCode}...`,
          );
          await TeacherClass.findOrCreate({
            where: {
              teacherId: teacher.id,
              classId: classInstance.id,
            },
            defaults: {
              teacherId: teacher.id,
              classId: classInstance.id,
            },
          });
        }
      }

      // class-student relationships..Only creates if the record doesn't exist
      for (const link of parsedData.classStudentLinks) {
        const [classCode, studentEmail] = link.split(':');
        const classInstance = await Class.findOne({
          where: { code: classCode },
        });
        const studentInstance = await Student.findOne({
          where: { email: studentEmail },
        });

        if (!classInstance) {
          LOG.warn(`Class not found for code: ${classCode}`);
        }
        if (!studentInstance) {
          LOG.warn(`Student not found for email: ${studentEmail}`);
        }

        if (classInstance && studentInstance) {
          LOG.info(
            `Finding or creating class-student relationship for class: ${classCode} and student: ${studentEmail}...`,
          );
          await ClassStudent.findOrCreate({
            where: {
              classId: classInstance.id,
              studentId: studentInstance.id,
            },
            defaults: {
              classId: classInstance.id,
              studentId: studentInstance.id,
            },
          });
        }
      }
    } catch (error) {
      LOG.error(
        `Error uploading CSV data: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
