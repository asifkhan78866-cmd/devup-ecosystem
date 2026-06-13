import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";
import { prisma } from "../lib/prisma";
import { AiService } from "../modules/ai/ai.service";

export const aiQueue = redis ? new Queue("aiQueue", { connection: redis }) : null;

const aiService = new AiService();

if (redis) {
  const worker = new Worker("aiQueue", async (job) => {
    const { type, payload } = job.data;

    if (type === "REVIEW_APPLICATION") {
      const analysis = await aiService.reviewApplication(payload.applicationId);
      // Optionally save the analysis back to the DB or notify admin
      console.log(`AI Review completed for app ${payload.applicationId}`);
      return analysis;
    }
    
    if (type === "GENERATE_BIO") {
      const bio = await aiService.generateBio(payload.startupDetails);
      return bio;
    }
  }, { connection: redis });

  worker.on("completed", (job) => {
    console.log(`AI job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`AI job ${job?.id} failed with error:`, err);
  });
} else {
  console.log("AI queue disabled because Redis is unavailable");
}
