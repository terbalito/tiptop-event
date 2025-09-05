import express from "express";
import { createController, getControllers } from "../controllers/controllerController.js";

const router = express.Router();

router.get("/", getControllers);
router.post("/", createController);

export default router;
