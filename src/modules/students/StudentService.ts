import axios from 'axios';
import Logger from '../../shared/config/logger';
import { Student, Class } from '../../shared/models';
import {
  ExternalStudentsResponseSchema,
  ExternalStudent,
  StudentItem,
} from './StudentDto';

const LOG = new Logger('StudentService.js');

export class StudentService {
  private readonly EXTERNAL_API_URL = 'http://localhost:5001/students';
  private readonly MAX_STUDENTS = 500;

  private mapStudentsToItems(
    students: ExternalStudent[],
    isExternal: boolean,
  ): StudentItem[] {
    return students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      isExternal: isExternal,
    }));
  }

  private async fetchExternalStudents(
    classCode: string,
  ): Promise<StudentItem[]> {
    try {
      const response = await axios.get(this.EXTERNAL_API_URL, {
        params: {
          class: classCode,
          offset: 0,
          limit: this.MAX_STUDENTS,
        },
        timeout: 5000,
      });

      if (response.status === 200) {
        LOG.info(
          `Fetched external students successfully for class ${classCode}`,
        );
      } else {
        LOG.warn(
          `Received non-200 response (${response.status}) when fetching external students for class ${classCode}`,
        );
      }

      const parsed = ExternalStudentsResponseSchema.safeParse(response.data);
      if (parsed.success) {
        return this.mapStudentsToItems(parsed.data.students, true);
      } else {
        LOG.warn(
          `Invalid external API response shape: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        );
      }
    } catch (error) {
      LOG.error(
        `Failed to fetch external students: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return [];
  }

  private combineStudents(
    internalStudents: StudentItem[],
    externalStudents: StudentItem[],
  ): StudentItem[] {
    const studentMap = new Map<string, StudentItem>();

    for (const student of internalStudents) {
      studentMap.set(student.email, student);
    }

    for (const student of externalStudents) {
      if (!studentMap.has(student.email)) {
        studentMap.set(student.email, student);
      }
    }

    return Array.from(studentMap.values());
  }

  async getStudentsByClassCode(
    classCode: string,
    offset: number,
    limit: number,
  ): Promise<{ students: StudentItem[]; count: number }> {
    try {
      // Fetch students via class relationship (efficient join)
      const classInstance = await Class.findOne({
        where: { code: classCode },
        include: [
          {
            model: Student,
            as: 'students',
            through: { attributes: [] }, // exclude join table data
            where: { toDelete: 0 }, // Filter out deleted students at DB level
          },
        ],
      });

      if (!classInstance) {
        LOG.warn(`Class with code ${classCode} not found`);
        return { students: [], count: 0 };
      }

      // Convert internal students to StudentItem format
      const internalStudents = classInstance.students || [];
      const internalStudentItems = this.mapStudentsToItems(
        internalStudents,
        false,
      );

      // Fetch external students
      const externalStudents = await this.fetchExternalStudents(classCode);
      LOG.info(
        `Fetched ${internalStudents.length} internal students and ${externalStudents.length} external students for class ${classCode}`,
      );

      // Combine and deduplicate students
      const combinedStudents = this.combineStudents(
        internalStudentItems,
        externalStudents,
      );

      // Sort combined students by name and apply pagination
      const allStudents = combinedStudents
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(offset, offset + limit);

      return {
        students: allStudents,
        count: allStudents.length,
      };
    } catch (error) {
      LOG.error(
        `Error fetching students for class ${classCode}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
