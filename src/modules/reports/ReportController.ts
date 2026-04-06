import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../shared/config/logger';
import ReportService from './ReportService';

const ReportController = Express.Router();
const LOG = new Logger('ReportController.ts');

const getTeacherWorkload: RequestHandler = async (req, res) => {
  try {
    LOG.info('Fetching teacher workload report');
    const workloadReport = await ReportService.getTeacherWorkloadReport();
    res.status(StatusCodes.OK).json(workloadReport);
  } catch (error) {
    LOG.error(
      `Error fetching teacher workload report: ${error instanceof Error ? error.message : String(error)}`,
    );
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Failed to fetch workload report' });
  }
};

ReportController.get('/reports/workload', getTeacherWorkload);

export default ReportController;
