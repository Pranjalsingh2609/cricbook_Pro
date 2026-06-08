import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  addBall,
  getMatch,
  scoreSummary,
  startMatch,
  undoBall,
  getMatchPlayers,
} from '../controllers/matchController.js';

const router = Router();
router.get('/:id', getMatch);
router.post('/:id/start', auth, startMatch);
router.get('/:matchId/summary', scoreSummary);
router.get('/:matchId/players', getMatchPlayers);
router.post('/:matchId/ball', auth, addBall);
router.post('/:matchId/undo', auth, undoBall);
export default router;
