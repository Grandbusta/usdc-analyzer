import express from "express";
import { getTransfers } from "./controllers/transfer";
const router = express.Router();

router.get("/transfers", getTransfers);

export default router;
