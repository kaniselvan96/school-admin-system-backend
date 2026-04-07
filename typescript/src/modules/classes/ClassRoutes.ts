import Express from 'express';
import ClassController from './ClassController';

const router = Express.Router();

router.use('/', ClassController);

export default router;
