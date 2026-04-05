import Express from 'express';
import DataImportController from './controllers/DataImportController';
import HealthcheckController from './controllers/HealthcheckController';
import UploadRoutes from './modules/upload/UploadRoutes';

const router = Express.Router();

router.use('/', DataImportController);
router.use('/', HealthcheckController);
router.use('/', UploadRoutes);

export default router;
