import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";

export const documentQueue = new Queue("documentQueue", { connection: redis });

const worker = new Worker("documentQueue", async (job) => {
  const { documentId, action } = job.data;
  
  if (action === "GENERATE_PDF") {
    // Logic to generate PDF from HTML template and upload to Supabase
    console.log(`Generating PDF for document ${documentId}`);
  }
}, { connection: redis });

worker.on("completed", (job) => {
  console.log(`Document job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`Document job ${job?.id} failed with error:`, err);
});
