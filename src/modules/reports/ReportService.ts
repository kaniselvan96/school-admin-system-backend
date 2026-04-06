import Logger from '../../shared/config/logger';
import { Teacher, ClassStudentTeacher, Subject } from '../../shared/models';

const LOG = new Logger('ReportService.ts');

export interface SubjectWorkload {
  subjectCode: string;
  subjectName: string;
  numberOfClasses: number;
}

export interface WorkloadReportData {
  [teacherName: string]: SubjectWorkload[];
}

export class ReportService {
  async getTeacherWorkloadReport(): Promise<WorkloadReportData> {
    try {
      // Get all teachers
      const teachers = await Teacher.findAll({
        order: [['name', 'ASC']],
      });

      // Transform the result into the required format
      const workloadReport: WorkloadReportData = {};

      for (const teacher of teachers) {
        // Get all class-subject assignments for this teacher
        const assignments = await ClassStudentTeacher.findAll({
          where: { teacherId: teacher.id },
          attributes: ['classId', 'subjectId'],
          include: [
            {
              model: Subject,
              as: 'Subject',
              attributes: ['id', 'code', 'name'],
              required: true,
            },
          ],
        });

        if (assignments.length === 0) {
          continue;
        }

        // Group by subject and count distinct classes
        const subjectMap = new Map<
          number,
          {
            code: string;
            name: string;
            classIds: Set<number>;
          }
        >();

        for (const assignment of assignments) {
          const subjectId = assignment.subjectId;
          const subject = assignment.Subject;

          if (!subject) {
            continue;
          }

          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              code: subject.code,
              name: subject.name,
              classIds: new Set<number>(),
            });
          }

          const subjectData = subjectMap.get(subjectId);
          if (subjectData) {
            subjectData.classIds.add(assignment.classId);
          }
        }

        // Convert to final format
        const subjectsArray: SubjectWorkload[] = [];
        for (const subjectData of subjectMap.values()) {
          subjectsArray.push({
            subjectCode: subjectData.code,
            subjectName: subjectData.name,
            numberOfClasses: subjectData.classIds.size,
          });
        }

        if (subjectsArray.length > 0) {
          workloadReport[teacher.name] = subjectsArray;
        }
      }

      LOG.info('Teacher workload report generated successfully');
      return workloadReport;
    } catch (error) {
      LOG.error(
        `Error generating teacher workload report: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

export default new ReportService();
