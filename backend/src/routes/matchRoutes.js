import { Router } from 'express';
import { addBall, getMatch, scoreSummary, startMatch, undoBall } from '../controllers/matchController.js';
import { auth } from '../middlewares/auth.js';

const router = Router();
router.get('/:id', getMatch);
router.get('/:matchId/summary', scoreSummary);
router.post('/:id/start', auth, startMatch);
router.post('/:matchId/ball', auth, addBall);
router.post('/:matchId/undo', auth, undoBall);
export default router;
