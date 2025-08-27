import express from "express";
import { registerSeller, loginSeller } from "../controllers/seller.controller.js";
import {registerBuyer, loginBuyer} from "../controllers/buyer.controller.js"
const router = express.Router();

router.post("/sellerregister", registerSeller);
router.post("/sellerlogin", loginSeller);
router.post("/buyerregister", registerBuyer);
router.post("/buyerlogin", loginBuyer);

export default router;