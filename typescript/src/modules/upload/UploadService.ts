import { CsvItemDto } from './UploadDto';
import {
  Teacher,
  Student,
  Class,
  Subject,
  ClassStudentTeacher,
} from '../../shared/models';
import Logger from '../../shared/config/logger';

const LOG = new Logger('UploadService.js');

export class UploadService {
  private async upsertBatch<T>(
    model: any,
    data: Map<string, T>,
  ): Promise<void> {
    if (data.size === 0) {
      return;
    }

    const dataArray = Array.from(data.values());
    await model.bulkCreate(dataArray, {
      updateOnDuplicate: Object.keys(dataArray[0] || {}),
      ignoreDuplicates: false,
    });
  }

  private parseCsv(csvData: CsvItemDto[]) {
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
    const classStudentTeacherLinks = new Set<string>(); // Teacher teaches Student in Class for Subject
    const studentSubjectClass = new Map<string, string>(); // Track which class a student takes each subject in

    for (const item of csvData) {
      // Validate: student can only take each subject in one class - latest data replaced
      const studentSubjectKey = `${item.studentEmail}:${item.subjectCode}`;
      const existingClass = studentSubjectClass.get(studentSubjectKey);

      if (existingClass && existingClass !== item.classCode) {
        LOG.info(
          `Replacing class for student=${item.studentEmail}, subject=${item.subjectCode}: ${existingClass} -> ${item.classCode}`,
        );
        // Remove old links for this student+subject from the previous class
        for (const link of classStudentTeacherLinks) {
          const [, linkStudent, linkClass, linkSubject] = link.split(':');
          if (
            linkStudent === item.studentEmail &&
            linkSubject === item.subjectCode &&
            linkClass === existingClass
          ) {
            classStudentTeacherLinks.delete(link);
          }
        }
      }

      studentSubjectClass.set(studentSubjectKey, item.classCode);

      // Process teachers (latest row wins for duplicate email)
      teachers.set(item.teacherEmail, {
        name: item.teacherName,
        email: item.teacherEmail,
      });

      // Process students (latest row wins for duplicate email)
      students.set(item.studentEmail, {
        email: item.studentEmail,
        name: item.studentName,
        toDelete: Number(item.toDelete) === 1 ? 1 : 0,
      });

      // Process subjects (latest row wins for duplicate code)
      subjects.set(item.subjectCode, {
        code: item.subjectCode,
        name: item.subjectName,
      });

      // Process classes (latest row wins for duplicate class code)
      classes.set(item.classCode, {
        code: item.classCode,
        name: item.classname,
        subjectCode: item.subjectCode,
      });

      // Track atomic ClassStudentTeacher relationship: Teacher teaches Student in Class for Subject
      classStudentTeacherLinks.add(
        `${item.teacherEmail}:${item.studentEmail}:${item.classCode}:${item.subjectCode}`,
      );
    }
    return {
      teachers,
      students,
      classes,
      subjects,
      classStudentTeacherLinks,
      studentSubjectClass,
    };
  }

  async processCsvData(csvData: CsvItemDto[]): Promise<void> {
    try {
      const parsedData = this.parseCsv(csvData);

      LOG.info(`Upserting ${parsedData.teachers.size} teachers...`);
      await this.upsertBatch(Teacher, parsedData.teachers);

      LOG.info(`Upserting ${parsedData.students.size} students...`);
      await this.upsertBatch(Student, parsedData.students);

      LOG.info(`Upserting ${parsedData.subjects.size} subjects...`);
      await this.upsertBatch(Subject, parsedData.subjects);

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

      // Create ClassStudentTeacher relationships: Teacher teaches Student in Class for Subject
      for (const link of parsedData.classStudentTeacherLinks) {
        const [teacherEmail, studentEmail, classCode, subjectCode] =
          link.split(':');

        const teacher = await Teacher.findOne({
          where: { email: teacherEmail },
        });
        const student = await Student.findOne({
          where: { email: studentEmail },
        });
        const classInstance = await Class.findOne({
          where: { code: classCode },
        });
        const subject = await Subject.findOne({
          where: { code: subjectCode },
        });

        if (!teacher) {
          LOG.warn(`Teacher not found for email: ${teacherEmail}`);
          continue;
        }
        if (!student) {
          LOG.warn(`Student not found for email: ${studentEmail}`);
          continue;
        }
        if (!classInstance) {
          LOG.warn(`Class not found for code: ${classCode}`);
          continue;
        }
        if (!subject) {
          LOG.warn(`Subject not found for code: ${subjectCode}`);
          continue;
        }

        LOG.info(
          `Creating ClassStudentTeacher relationship: teacher=${teacherEmail}, student=${studentEmail}, class=${classCode}, subject=${subjectCode}...`,
        );
        try {
          await ClassStudentTeacher.findOrCreate({
            where: {
              teacherId: teacher.id,
              studentId: student.id,
              classId: classInstance.id,
              subjectId: subject.id,
            },
            defaults: {
              teacherId: teacher.id,
              studentId: student.id,
              classId: classInstance.id,
              subjectId: subject.id,
            },
          });
        } catch (relationError) {
          let relErrorMsg = '';
          if (relationError instanceof Error) {
            relErrorMsg = relationError.message;
            // If it's a Sequelize ValidationError, get the detailed errors
            if ('errors' in relationError) {
              const errors = (relationError as any).errors;
              if (Array.isArray(errors)) {
                relErrorMsg +=
                  ': ' +
                  errors.map((e: any) => `${e.path}: ${e.message}`).join('; ');
              }
            }
          } else {
            relErrorMsg = String(relationError);
          }
          LOG.error(`Failed to create relationship: ${relErrorMsg}`);
          throw relationError;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      LOG.error(`Error uploading CSV data: ${errorMsg}`);
      throw error;
    }
  }
}
