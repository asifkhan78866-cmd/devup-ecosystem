import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { registerSchema, loginSchema } from "./auth.schema";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new AuthController();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/logout", requireAuth, controller.logout);
router.get("/me", requireAuth, controller.getMe);

export default router;
