import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../shared/config/logger';
import { StudentService } from './StudentService';
import validate from '../../shared/middleware/validate';
import { GetStudentsParamsSchema, GetStudentsQuerySchema } from './StudentDto';

const StudentController = Express.Router();
const LOG = new Logger('StudentController.js');
const studentService = new StudentService();

const getStudentsByClassCode: RequestHandler = async (req, res) => {
  try {
    const { classCode } = req.params;
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);

    LOG.info(
      `Fetching students for class code: ${classCode}, offset: ${offset}, limit: ${limit}`,
    );

    const students = await studentService.getStudentsByClassCode(
      classCode,
      offset,
      limit,
    );
    LOG.info(
      `Fetched ${students.students.length} students for class code ${classCode}`,
    );
    res.status(StatusCodes.OK).json(students);
  } catch (error) {
    LOG.error(`Error fetching students: ${error}`);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Failed to fetch students' });
  }
};

StudentController.get(
  '/class/:classCode/students',
  validate({ params: GetStudentsParamsSchema, query: GetStudentsQuerySchema }),
  getStudentsByClassCode,
);

export default StudentController;
