import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../shared/config/logger';
import { ClassService } from './ClassService';
import validate from '../../shared/middleware/validate';
import { UpdateClassParamsSchema, UpdateClassBodySchema } from './ClassDto';

const ClassController = Express.Router();
const LOG = new Logger('ClassController.js');
const classService = new ClassService();

const updateClassHandler: RequestHandler = async (req, res) => {
  try {
    const { classCode } = req.params;
    const { className } = req.body;

    LOG.info(`Updating class ${classCode} name to ${className}...`);

    await classService.updateClassByClassCode(classCode, className);

    LOG.info(`Updated class ${classCode} name to ${className}`);
    res.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    LOG.error(`Error updating class data: ${error}`);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Failed to update class data' });
  }
};

ClassController.put(
  '/class/:classCode',
  validate({ params: UpdateClassParamsSchema, body: UpdateClassBodySchema }),
  updateClassHandler,
);

export default ClassController;
