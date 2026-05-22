import { Resend } from "resend";
import { env } from "../config/env";

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
