import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { OPENROUTER_MODELS } from "../../config/openrouter";

export class AiService {
  private async callOpenRouter(prompt: string, model: string = OPENROUTER_MODELS.default) {
    const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": env.FRONTEND_URL,
        "X-Title": "DevUp Ecosystem",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new AppError(429, "AI rate limit exceeded from upstream provider.");
      }
      throw new AppError(500, "Failed to call AI service");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async reviewApplication(applicationId: string) {
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new AppError(404, "Application not found");

    const prompt = `Review the following startup application and provide a score out of 10 along with a brief analysis. 
    Startup Name: ${app.startupName}
    Domain: ${app.domain}
    One Liner: ${app.oneLiner}
    Stage: ${app.stage}
    MRR: ${app.mrr || "0"}
    Needs: ${app.needs.join(", ")}`;

    const analysis = await this.callOpenRouter(prompt, OPENROUTER_MODELS.default);
    return { analysis };
  }

  async matchCofounders(profileId: string) {
    const profile = await prisma.cofounderProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new AppError(404, "Profile not found");

    // Grab 50 active profiles to find matches
    const allProfiles = await prisma.cofounderProfile.findMany({
      where: { isActive: true, id: { not: profileId } },
      take: 50,
      select: { id: true, role: true, stage: true, seeking: true }
    });

    const prompt = `Find the top 3 best co-founder matches for this profile.
    Target Profile: Role=${profile.role}, Stage=${profile.stage}, Seeking=${profile.seeking.join(", ")}
    Candidates: ${JSON.stringify(allProfiles)}
    Return ONLY a JSON array of the 3 best candidate IDs.`;

    const rawMatches = await this.callOpenRouter(prompt, OPENROUTER_MODELS.fast);
    
    // Parse the JSON array safely
    let matches: string[] = [];
    try {
      matches = JSON.parse(rawMatches.match(/\[.*\]/s)?.[0] || "[]");
    } catch (e) {
      console.error("Failed to parse AI response:", rawMatches);
    }

    return await prisma.cofounderProfile.findMany({
      where: { id: { in: matches } },
      include: { user: { select: { id: true, profile: true } } }
    });
  }

  async generateBio(startupDetails: string) {
    const prompt = `Generate a compelling, professional, and concise 2-sentence bio for a startup given these details: ${startupDetails}`;
    const bio = await this.callOpenRouter(prompt, OPENROUTER_MODELS.fast);
    return { bio };
  }
}
