import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";
import { resend } from "../lib/resend";

export const emailQueue = redis ? new Queue("emailQueue", { connection: redis }) : null;

if (redis) {
  const worker = new Worker("emailQueue", async (job) => {
    const { to, subject, html, from, attachments } = job.data;

    /*
     * Attachments used to be dropped here — the job carried them and this
     * destructure left them out — so with Redis switched on every offer letter
     * email would have gone out without its PDF. A Buffer comes back from the
     * queue as { type: "Buffer", data: [...] } and is rebuilt.
     */
    const result: any = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(Array.isArray(attachments) && attachments.length
        ? {
            attachments: attachments.map((a: { filename: string; content: any }) => ({
              filename: a.filename,
              content:
                typeof a.content === "string" ? a.content : Buffer.from(a.content?.data ?? a.content ?? []),
            })),
          }
        : {}),
    });

    // Resend returns { error } rather than throwing. Throwing here is what lets
    // BullMQ retry the job; without it a refused email counted as delivered.
    if (result?.error) {
      throw new Error(`Resend rejected email to ${to}: ${result.error.message ?? JSON.stringify(result.error)}`);
    }
  }, { connection: redis });

  worker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed with error:`, err);
  });
}
