import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";

export const documentQueue = redis ? new Queue("documentQueue", { connection: redis }) : null;

let worker: Worker | null = null;

if (redis) {
  worker = new Worker("documentQueue", async (job) => {
    const { documentId, type } = job.data;
    // Process document logic (e.g., convert, thumbnail, watermark)
    console.log(`Processing document ${documentId} of type ${type}`);
  }, { connection: redis });

  worker.on("completed", (job) => {
    console.log(`Document job ${job.id} completed.`);
  });
} else {
  console.log("Document queue disabled because Redis is unavailable");
}

worker?.on("failed", (job, err) => {
  console.error(`Document job ${job?.id} failed with error:`, err);
});
