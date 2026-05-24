import { prisma } from "../../lib/prisma";
import { resend } from "../../lib/resend";
import { env } from "../../config/env";
import { ServiceRequestStatus } from "@prisma/client";

export class ServicesService {
  static async createRequest(data: {
    serviceId: string;
    serviceName: string;
    name: string;
    company: string;
    email: string;
    details: string;
  }) {
    const request = await prisma.serviceRequest.create({
      data,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: data.email,
      subject: `DevUp: We received your request for ${data.serviceName}`,
      html: `
        <h2>Hi ${data.name},</h2>
        <p>Thanks for reaching out about our <strong>${data.serviceName}</strong> service.</p>
        <p>Our team is reviewing your details and will be in touch within 24 hours to schedule a kickoff call.</p>
        <br/>
        <p>Best,<br/>The DevUp Team</p>
      `,
    });

    // Send notification to team
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: env.RESEND_TEAM_EMAIL,
      subject: `[NEW SERVICE REQUEST] ${data.serviceName} from ${data.company}`,
      html: `
        <h2>New Service Request</h2>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Details:</strong><br/>${data.details}</p>
      `,
    });

    return request;
  }

  static async getAllRequests() {
    return prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateStatus(id: string, status: ServiceRequestStatus) {
    return prisma.serviceRequest.update({
      where: { id },
      data: { status },
    });
  }
}
