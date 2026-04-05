import Express from 'express';
import StudentController from './StudentController';


const router = Express.Router();

router.use('/', StudentController);

export default router;
