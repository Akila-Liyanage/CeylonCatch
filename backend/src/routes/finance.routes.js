import express from 'express';
import { addPaymentMethod, getPaymentMethods, deletePaymentMethod } from '../controllers/finance.controller/payment.controller.js';
import { createTransaction, getTransactions, getAllTransactions } from '../controllers/finance.controller/transaction.controller.js';
import { generateInvoice, getInvoices, getAllInvoices } from '../controllers/finance.controller/invoice.controller.js';
import { generateReport, getReports } from '../controllers/finance.controller/report.controller.js';
import { paySalary, getSalaries } from '../controllers/finance.controller/salary.controller.js';
import { calculateSalarySlip } from '../controllers/finance.controller/payroll.controller.js';
import { createMarketEntry, listMarketEntries, getMonthlyMarketReport, updateMarketEntry, deleteMarketEntry } from '../controllers/finance.controller/market.controller.js';

const router = express.Router();

// PAYMENT METHODS
router.post("/payments", addPaymentMethod);
router.get("/payments", getPaymentMethods);
router.delete("/payments/:id", deletePaymentMethod);

//TRANSACTIONS 
router.post("/transactions", createTransaction);
router.get("/transactions", getTransactions);
router.get("/transactions/all", getAllTransactions); // Admin only

// //INVOICES
router.post("/invoices", generateInvoice);
router.get("/invoices", getInvoices);
router.get("/invoices/all", getAllInvoices); // Admin only

// //REPORTS 
router.post("/reports", generateReport);
router.get("/reports", getReports);

// //SALARIES
router.post("/salaries", paySalary);
router.get("/salaries", getSalaries);

// PAYROLL
router.post('/payroll/calculate-slip', calculateSalarySlip);

// MARKET income/expense and monthly report
router.post('/market', createMarketEntry);
router.get('/market', listMarketEntries);
router.get('/market/monthly-report', getMonthlyMarketReport);
router.put('/market/:id', updateMarketEntry);
router.delete('/market/:id', deleteMarketEntry);

export default router;
