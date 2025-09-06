import express from "express";
import { createController, loginController, getControllers, updateController, deleteController } from "../controllers/controllerController.js";

const router = express.Router();

router.post("/", createController);
router.post("/login", loginController);
router.get("/", getControllers);
router.put("/:id", updateController);
router.delete("/:id", deleteController);


export default router;
