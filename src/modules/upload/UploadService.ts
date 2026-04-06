import { CsvItem } from 'CsvItem';
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
    uniqueFields: string[],
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
    const classStudentTeacherLinks = new Set<string>(); // Teacher teaches Student in Class for Subject

    for (const [index, item] of csvData.entries()) {
      // Validate all required fields as per model definitions
      const missingFields: string[] = [];

      // Teacher fields (email, name required)
      if (!item.teacherEmail) missingFields.push('teacherEmail');
      if (!item.teacherName) missingFields.push('teacherName');

      // Student fields (email, name required)
      if (!item.studentEmail) missingFields.push('studentEmail');
      if (!item.studentName) missingFields.push('studentName');

      // Class fields (code, name required)
      if (!item.classCode) missingFields.push('classCode');
      if (!item.classname) missingFields.push('classname');

      // Subject fields (code, name required)
      if (!item.subjectCode) missingFields.push('subjectCode');
      if (!item.subjectName) missingFields.push('subjectName');

      if (missingFields.length > 0) {
        LOG.warn(
          `Skipping row ${index + 1}: missing required fields [${missingFields.join(', ')}]`,
        );
        continue;
      }

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

      // Track atomic ClassStudentTeacher relationship: Teacher teaches Student in Class for Subject
      if (
        item.teacherEmail &&
        item.studentEmail &&
        item.classCode &&
        item.subjectCode
      ) {
        classStudentTeacherLinks.add(
          `${item.teacherEmail}:${item.studentEmail}:${item.classCode}:${item.subjectCode}`,
        );
      }
    }
    return {
      teachers,
      students,
      classes,
      subjects,
      classStudentTeacherLinks,
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
