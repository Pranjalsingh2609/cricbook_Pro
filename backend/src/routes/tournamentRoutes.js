import { Router } from 'express';
import { createTournament, generateFixtures, getTournament, listTournaments, deleteTournament} from '../controllers/tournamentController.js';
import { auth } from '../middlewares/auth.js';

const router = Router();
router.use(auth);
router.post('/', createTournament);
router.get('/', listTournaments);
router.get('/:id', getTournament);
router.post('/:id/generate-fixtures', generateFixtures);
router.delete('/:id', deleteTournament);
export default router;
