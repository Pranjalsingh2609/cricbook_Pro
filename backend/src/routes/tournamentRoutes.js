import { Router } from 'express';
import { createTournament, generateFixtures, getTournament, listTournaments } from '../controllers/tournamentController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);
router.post('/', createTournament);
router.get('/', listTournaments);
router.get('/:id', getTournament);
router.post('/:id/generate-fixtures', generateFixtures);
export default router;
