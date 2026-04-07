import Express from 'express';
import ReportController from './ReportController';

const router = Express.Router();

router.use('/', ReportController);

export default router;
