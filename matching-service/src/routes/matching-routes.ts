import { Router } from 'express';
import { MatchingController } from '../controllers/matching-controller';

const router = Router();

router.get('/health', MatchingController.health);
router.post('/join', MatchingController.join);
router.post('/leave', MatchingController.leave);
router.get('/status/:userId', MatchingController.status);
router.get('/queue', MatchingController.queue);

export default router;
