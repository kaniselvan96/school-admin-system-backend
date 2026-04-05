import Express from 'express';
import HealthcheckController from './shared/controllers/HealthcheckController';
import UploadRoutes from './modules/upload/UploadRoutes';
import ClassRoutes from './modules/classes/ClassRoutes';
import StudentRoutes from './modules/students/StudentRoutes';

const router = Express.Router();

router.use('/', HealthcheckController);
router.use('/', UploadRoutes);
router.use('/', ClassRoutes);
router.use('/', StudentRoutes);

export default router;
