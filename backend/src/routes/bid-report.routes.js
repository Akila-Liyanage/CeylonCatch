import express from 'express';
import { generateBiddingReport, getReportFilters } from '../controllers/bid-report.controller.js';

const router = express.Router();

// Generate bidding report
router.get('/generate', generateBiddingReport);

// Get available filters for reports
router.get('/filters', getReportFilters);

export default router;
