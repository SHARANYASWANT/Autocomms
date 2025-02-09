import { Router } from 'express';
const router = Router();
import AuthController from '../controllers/authController.js';

router.post('/signup', AuthController.signup);
router.post('/signin', AuthController.signin);
router.post('/signout', AuthController.signout);

export default router;
