import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./messages.controller";

const router = Router();

router.use(requireAuth);

router.get("/:contactId", controller.getMessages);
router.post("/:contactId", controller.sendMessage);

export default router;
