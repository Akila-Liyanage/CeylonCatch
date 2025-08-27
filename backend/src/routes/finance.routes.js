import express from 'express';
import { addPaymentMethod, getPaymentMethods, deletePaymentMethod } from '../controllers/finance.controller/payment.controller.js';

const router = express.Router();

// PAYMENT METHODS
router.post("/payments", addPaymentMethod);
router.get("/payments", getPaymentMethods);
router.delete("/payments/:id", deletePaymentMethod);

//TRANSACTIONS 
// router.post("/transactions",createTransaction);
// router.get("/transactions", getTransactions);
// router.get("/transactions/all", getAllTransactions); // Admin only

// //INVOICES
// router.post("/invoices", generateInvoice);
// router.get("/invoices", getInvoices);
// router.get("/invoices/all", getAllInvoices); // Admin only

// //REPORTS 
// router.post("/reports", generateReport);
// router.get("/reports", getReports);

// //SALARIES
// router.post("/salaries", paySalary);
// router.get("/salaries", getSalaries);

export default router;
