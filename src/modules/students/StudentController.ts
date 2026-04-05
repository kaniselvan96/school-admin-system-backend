import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../shared/config/logger';
import { StudentService } from './StudentService';

const StudentController = Express.Router();
const LOG = new Logger('StudentController.js');
const studentService = new StudentService();

const getStudentsByClassCode: RequestHandler = async (req, res) => {
  try {
    LOG.info(
      `Fetching students for class code: ${req.params.classCode} and offset: ${req.query.offset} limit: ${req.query.limit}`,
    );

    const classCode = req.params.classCode;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    if (!classCode || offset < 0 || limit <= 0) {
      LOG.warn('Invalid class code or pagination parameters');
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'Invalid class code or pagination parameters' });
    }

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

StudentController.get('/class/:classCode/students', getStudentsByClassCode);

export default StudentController;
