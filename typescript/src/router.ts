import Express from 'express';
import HealthcheckController from './shared/controllers/HealthcheckController';
import UploadRoutes from './modules/upload/UploadRoutes';
import ClassRoutes from './modules/classes/ClassRoutes';
import StudentRoutes from './modules/students/StudentRoutes';
import ReportRoutes from './modules/reports/ReportRoutes';

const router = Express.Router();

router.use('/', HealthcheckController);
router.use('/', UploadRoutes);
router.use('/', ClassRoutes);
router.use('/', StudentRoutes);
router.use('/', ReportRoutes);

export default router;
