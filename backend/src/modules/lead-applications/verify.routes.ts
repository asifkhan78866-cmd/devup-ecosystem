import { Router } from "express";
import * as appointments from "./appointments.service";

/**
 * Public verification, reached by scanning the QR on a revenue stamp.
 *
 * No authentication, by design: the person checking is a college office or an
 * event desk, not a DevUp member, and requiring an account would mean nobody
 * ever checks. Read-only, and the service decides what a stranger may see.
 */
const router = Router();

router.get("/appointment/:serial", async (req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json({ success: true, data: await appointments.verifyBySerial(String(req.params.serial)) });
});

export default router;
