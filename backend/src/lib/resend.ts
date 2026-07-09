import { Resend } from "resend";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export const resend = new Resend(env.RESEND_API_KEY);

export const EmailTemplates = {
  applicationReceived: (applicantName: string, startupName: string) => `
    <h1>Application Received</h1>
    <p>Hi ${applicantName},</p>
    <p>We've received your application for ${startupName}. Our team will review it shortly!</p>
  `,
  applicationApproved: (founderName: string, startupName: string, link: string) => `
    <h1>Welcome to DevUp!</h1>
    <p>Hi ${founderName},</p>
    <p>Congratulations! ${startupName} has been approved.</p>
    <p><a href="${link}">Complete your onboarding here</a></p>
  `,
  applicationRejected: (founderName: string, startupName: string, reason: string) => `
    <h1>Update on your application</h1>
    <p>Hi ${founderName},</p>
    <p>Thank you for applying with ${startupName}. Unfortunately, we cannot proceed at this time.</p>
    <p>Reason: ${reason}</p>
  `,
  documentReady: (founderName: string, documentName: string, link: string) => `
    <h1>Document ready for signature</h1>
    <p>Hi ${founderName},</p>
    <p>Please sign the following document: ${documentName}.</p>
    <p><a href="${link}">Sign Document</a></p>
  `,
  documentSigned: (startupName: string, documentName: string) => `
    <h1>Document Signed</h1>
    <p>${startupName} has signed the ${documentName}.</p>
  `,
  jobApplicationReceived: (applicantName: string, roleName: string) => `
    <h1>New Job Application</h1>
    <p>${applicantName} has applied for the ${roleName} role.</p>
  `,
  welcomeEmail: (userName: string) => `
    <h1>Welcome to DevUp Ecosystem</h1>
    <p>Hi ${userName},</p>
    <p>We're thrilled to have you here!</p>
  `,
  cofounderRequest: (fromName: string, message: string) => `
    <h1>New Co-founder Connection Request</h1>
    <p>${fromName} wants to connect with you!</p>
    <p>Message: ${message}</p>
  `,
};

export async function sendTeamInviteEmail(params: {
  to: string, startupName: string, role: string, inviteLink: string
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: params.to,
    subject: `You've been invited to join ${params.startupName} on DevUp`,
    html: `
      <div style="background:#0a0a0a;padding:40px;font-family:Inter,sans-serif">
        <h2 style="color:#fff">You've been invited 🎉</h2>
        <p style="color:#a1a1a1">
          You've been invited to join <strong style="color:#fff">${params.startupName}</strong> 
          as a <strong style="color:#c8f135">${params.role}</strong> on DevUp Ecosystem.
        </p>
        <a href="${params.inviteLink}" 
          style="display:inline-block;margin-top:20px;padding:12px 24px;
          background:#c8f135;color:#000;border-radius:10px;
          text-decoration:none;font-weight:700">
          Accept Invite
        </a>
      </div>
    `,
  });

  if (error) {
    // Resend returns errors instead of throwing — surface them so the invite
    // endpoint reports a real failure instead of a false "sent".
    throw new AppError(502, `Email delivery failed: ${error.message}`, "EMAIL_SEND_FAILED");
  }
}

export async function sendDocumentReadyEmail(to: string, documentName: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject: 'Document ready for signature - DevUp',
    html: EmailTemplates.documentReady("Founder", documentName, `${process.env.FRONTEND_URL}/dashboard/documents`),
  }).catch(e => console.error(e));
}

export async function sendDocumentSignedEmail(to: string, documentName: string, founderName: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject: 'Document signed - DevUp',
    html: EmailTemplates.documentSigned(founderName, documentName),
  }).catch(e => console.error(e));
}
