import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../shared/config/logger';
import { ClassService } from './ClassService';

const ClassController = Express.Router();
const LOG = new Logger('ClassController.js');
const classService = new ClassService();

const updateClassHandler: RequestHandler = async (req, res) => {
  try {
    LOG.info(
      `Updating class data for class code: ${req.params.classCode} and ${JSON.stringify(req.body)}...`,
    );

    const classCode = req.params.classCode;
    const { className } = req.body;

    if (!classCode || !className) {
      LOG.warn('Invalid class code or missing name in request body');
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'Invalid class code or missing name' });
    }

    // Call the service to update the class data
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

ClassController.put('/class/:classCode', updateClassHandler);

export default ClassController;
