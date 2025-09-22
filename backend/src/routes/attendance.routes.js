import { Router } from 'express';
import { upsertAttendance, getAttendance } from '../controllers/finance.controller/attendance.controller.js';

const router = Router();

router.post('/', upsertAttendance);
router.get('/', getAttendance);

export default router;



