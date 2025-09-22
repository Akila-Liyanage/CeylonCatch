import { Router } from 'express';
import { createEmployee, getEmployee, listEmployees } from '../controllers/finance.controller/employee.controller.js';

const router = Router();

router.post('/', createEmployee);
router.get('/', listEmployees);
router.get('/:employeeId', getEmployee);

export default router;



