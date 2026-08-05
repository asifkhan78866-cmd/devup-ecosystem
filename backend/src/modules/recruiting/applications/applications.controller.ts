import { Request, Response } from "express";
import * as service from "./applications.service";

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export class ApplicationsController {
  // ── Tenant-scoped ──────────────────────────────────
  async list(req: Request, res: Response) {
    const data = await service.list(req.db, {
      stage: req.query.stage as never,
      jobId: req.query.jobId as string,
      college: req.query.college as string,
      q: req.query.q as string,
      includeClosed: req.query.includeClosed === "true",
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 25,
    });
    ok(res, data);
  }

  async board(req: Request, res: Response) {
    ok(res, await service.board(req.db, req.query.jobId as string | undefined));
  }

  async getOne(req: Request, res: Response) {
    ok(res, await service.getOne(req.db, req.params.id as string));
  }

  async transition(req: Request, res: Response) {
    const data = await service.transition({
      startupId: req.startupId!,
      applicationId: req.params.id as string,
      toStage: req.body.toStage,
      version: req.body.version,
      note: req.body.note,
      actorId: req.user!.id,
      tenantRole: req.tenantRole,
    });
    ok(res, data);
  }

  async reject(req: Request, res: Response) {
    const data = await service.reject({
      startupId: req.startupId!,
      applicationId: req.params.id as string,
      reason: req.body.reason,
      version: req.body.version,
      actorId: req.user!.id,
    });
    ok(res, data);
  }

  // ── Student-facing ─────────────────────────────────
  async apply(req: Request, res: Response) {
    // No resume check here — the service decides, because a resume already saved
    // on the profile counts and only the service can see it.
    const data = await service.apply(
      { jobId: req.params.id as string, userId: req.user!.id, ...req.body },
      req.file
    );
    ok(res, data, 201);
  }

  async mine(req: Request, res: Response) {
    ok(res, await service.myApplications(req.user!.id));
  }

  async withdraw(req: Request, res: Response) {
    ok(res, await service.withdraw(req.params.id as string, req.user!.id));
  }
}
