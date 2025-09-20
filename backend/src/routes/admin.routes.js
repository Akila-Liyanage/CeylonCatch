import express from 'express';
import { getSeller, updateSeller, getBuyer, updateBuyer } from '../controllers/user.controller.js';
import { getAllLoginHistory } from '../controllers/admin.controller.js'

const router = express.Router();


router.get("/seller-by-email/:email", getSeller);
router.put("/seller-by-email/:email", updateSeller);

router.get("/buyer-by-email/:email", getBuyer);
router.put("/buyer-by-email/:email", updateBuyer);

router.get("/login-history", getAllLoginHistory);


export default router;
