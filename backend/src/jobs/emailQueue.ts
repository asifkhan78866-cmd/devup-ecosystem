import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";
import { resend } from "../lib/resend";

export const emailQueue = redis ? new Queue("emailQueue", { connection: redis }) : null;

if (redis) {
  const worker = new Worker("emailQueue", async (job) => {
    const { to, subject, html, from } = job.data;
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
  }, { connection: redis });

  worker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed with error:`, err);
  });
} else {
  console.log("Email queue disabled because Redis is unavailable");
}
