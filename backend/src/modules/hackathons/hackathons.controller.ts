import { Request, Response } from "express";
import { HackathonsService } from "./hackathons.service";
import * as leadAccess from "./leadAccess.service";
import { verifyUpload } from "../../lib/uploads";

/** A team's private access token travels in a header, never in a URL. */
const leadToken = (req: Request) => req.get("x-lead-token");

const hackathonsService = new HackathonsService();

export class HackathonsController {
  async getHackathons(req: Request, res: Response) {
    const { data, meta } = await hackathonsService.getHackathons(req.query);
    res.status(200).json({ success: true, data, meta });
  }

  async getFeatured(req: Request, res: Response) {
    const data = await hackathonsService.getFeaturedHackathon();
    res.status(200).json({ success: true, data });
  }

  async getById(req: Request, res: Response) {
    const data = await hackathonsService.getHackathon(req.params.id);
    res.status(200).json({ success: true, data });
  }

  async createHackathon(req: Request, res: Response) {
    const data = await hackathonsService.createHackathon(req.body);
    res.status(201).json({ success: true, data });
  }

  async updateHackathon(req: Request, res: Response) {
    const data = await hackathonsService.updateHackathon(req.params.id as string, req.body);
    res.status(200).json({ success: true, data });
  }

  async deleteHackathon(req: Request, res: Response) {
    await hackathonsService.deleteHackathon(req.params.id as string);
    res.status(200).json({ success: true, message: "Hackathon deleted successfully" });
  }

  async uploadLogo(req: Request, res: Response) {
    const data = await hackathonsService.uploadImage(req.params.id as string, "logo", verifyUpload(req.file, "image"));
    res.status(200).json({ success: true, data });
  }

  async createPartner(req: Request, res: Response) {
    const data = await hackathonsService.createPartner(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  }

  async updatePartner(req: Request, res: Response) {
    const data = await hackathonsService.updatePartner(req.params.id, req.params.pid, req.body);
    res.status(200).json({ success: true, data });
  }

  async deletePartner(req: Request, res: Response) {
    await hackathonsService.deletePartner(req.params.id, req.params.pid);
    res.status(200).json({ success: true, message: "Partner deleted" });
  }

  async uploadPartnerLogo(req: Request, res: Response) {
    const data = await hackathonsService.uploadPartnerLogo(req.params.id as string, req.params.pid as string, verifyUpload(req.file, "image"));
    res.status(200).json({ success: true, data });
  }

  async uploadBanner(req: Request, res: Response) {
    const data = await hackathonsService.uploadImage(req.params.id as string, "banner", verifyUpload(req.file, "image"));
    res.status(200).json({ success: true, data });
  }

  async register(req: Request, res: Response) {
    const data = await hackathonsService.register(req.params.id as string, req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  }

  /**
   * Public registration. Returns the team's private access token — never the
   * registration's id — and emails the same "manage your registration" link.
   */
  async createLead(req: Request, res: Response) {
    const lead = await hackathonsService.createLead(req.params.id as string, req.body);
    const token = await leadAccess.issueLeadToken(lead.id);
    const hackathon = await hackathonsService.titleOf(lead.hackathonId);
    await leadAccess.sendRegistrationLink(lead, hackathon, token);
    res.status(201).json({ success: true, data: { accessToken: token } });
  }

  /** "Email me my link." Same answer whether or not the phone is registered. */
  async requestLeadAccess(req: Request, res: Response) {
    await leadAccess.requestAccessLink(req.params.id as string, String(req.body.phone));
    res.status(202).json({
      success: true,
      data: { message: "If this phone is registered with an email, a private link is on its way to that inbox." },
    });
  }

  /** The caller's own registration, found by its token. */
  async myLead(req: Request, res: Response) {
    const lead = await leadAccess.leadFromToken(req.params.id as string, leadToken(req));
    res.status(200).json({ success: true, data: leadAccess.ownView(lead) });
  }

  async updateMyLead(req: Request, res: Response) {
    const lead = await leadAccess.leadFromToken(req.params.id as string, leadToken(req));
    await hackathonsService.updateLead(lead.hackathonId, lead.id, req.body);
    const fresh = await leadAccess.leadFromToken(req.params.id as string, leadToken(req));
    res.status(200).json({ success: true, data: leadAccess.ownView(fresh) });
  }

  async markMyLeadRedirected(req: Request, res: Response) {
    const lead = await leadAccess.leadFromToken(req.params.id as string, leadToken(req));
    await hackathonsService.markLeadRedirected(lead.id);
    res.status(200).json({ success: true, data: { redirected: true } });
  }

  async getLeads(req: Request, res: Response) {
    const { data, meta } = await hackathonsService.getLeads(req.params.id as string);
    res.status(200).json({ success: true, data, meta });
  }

  /** The caller's own team submits; the registration comes from the token. */
  async submitMyLead(req: Request, res: Response) {
    const lead = await leadAccess.leadFromToken(req.params.id as string, leadToken(req));
    const deck = verifyUpload(req.file, "document");
    const submission = await hackathonsService.uploadSubmission(lead.hackathonId, lead.id, deck);
    res.status(201).json({ success: true, data: { status: submission.status, createdAt: submission.createdAt } });
  }

  async getAllSubmissions(req: Request, res: Response) {
    const { data, meta } = await hackathonsService.getAllSubmissions(req.params.id as string);
    res.status(200).json({ success: true, data, meta });
  }

  async updateSubmissionStatus(req: Request, res: Response) {
    const submission = await hackathonsService.updateSubmissionStatus(req.params.id as string, req.params.submissionId as string, req.body.status);
    res.status(200).json({ success: true, data: submission });
  }
}
