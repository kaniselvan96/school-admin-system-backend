import Express from 'express';
import UploadController from './UploadController';

const router = Express.Router();

router.use('/', UploadController);

export default router;
