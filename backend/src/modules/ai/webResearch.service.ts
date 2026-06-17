import { prisma } from '../../lib/prisma'

const FIRECRAWL_URL = process.env.FIRECRAWL_BASE_URL!
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY!
const CACHE_HOURS = Number(process.env.AI_RESEARCH_CACHE_HOURS || 24)

interface StartupAnalysis {
  oneLiner: string
  overview: string
  problem: string
  solution: string
  targetMarket: string
  businessModel: string
  tractionSignals: string[]
  fundingSignals: string[]
  teamHighlights: string[]
  redFlags: string[]
  confidence: 'high' | 'medium' | 'low'
  sourcesUsed: string[]
  generatedAt: string
}

// ── STEP 1: Crawl the startup's website ──────────
async function crawlWebsite(url: string): Promise<{
  markdown: string | null
  error: string | null
}> {
  try {
    const response = await fetch(`${FIRECRAWL_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 15000,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return { markdown: null, error: `Firecrawl ${response.status}: ${text}` }
    }

    const data = await response.json() as any
    return { markdown: data.data?.markdown || null, error: null }
  } catch (err) {
    return { 
      markdown: null, 
      error: err instanceof Error ? err.message : 'Unknown crawl error' 
    }
  }
}

// ── STEP 2: Online-grounded synthesis via OpenRouter ──
async function synthesizeAnalysis(
  startupName: string,
  websiteUrl: string,
  crawledContent: string | null
): Promise<{ analysis: StartupAnalysis; tokensUsed: number }> {
  
  const systemPrompt = `You are a senior startup analyst at a top Indian 
startup incubator. You evaluate startups for an internal ecosystem database. 
Be factual, cite uncertainty honestly, and never invent funding numbers, 
investor names, or traction metrics you cannot support from the provided 
content or your web search results.

Respond with ONLY valid JSON matching this exact shape, no markdown fences, 
no preamble, no explanation outside the JSON:

{
  "oneLiner": "string, max 15 words",
  "overview": "string, 120-180 words, written for a startup directory",
  "problem": "string, the problem this startup addresses",
  "solution": "string, how they solve it",
  "targetMarket": "string",
  "businessModel": "string, how they likely make money",
  "tractionSignals": ["array of strings, e.g. user counts, partnerships"],
  "fundingSignals": ["array of strings, any funding/investor mentions found"],
  "teamHighlights": ["array of strings, notable founder/team facts"],
  "redFlags": ["array of strings, anything unclear, missing, or concerning"],
  "confidence": "high" | "medium" | "low",
  "sourcesUsed": ["array of URLs you referenced"]
}

If information for a field is not available, use an empty array [] or 
a string explaining the gap (e.g. "No public funding information found") — 
never fabricate.`

  const userPrompt = `Startup name: ${startupName}
Website: ${websiteUrl}

${crawledContent 
    ? `Here is the scraped content from their official website:\n\n${crawledContent.slice(0, 8000)}`
    : `The website could not be crawled directly. Rely on your web search 
       to find what you can about this startup.`}

Research this startup using web search for any additional context 
(news, funding announcements, social presence, reviews) beyond what's 
shown above, then return the structured JSON analysis.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || '',
      'X-Title': 'DevUp Ecosystem',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_ONLINE_MODEL || 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`)
  }

  const data = await response.json() as any
  const rawText = data.choices?.[0]?.message?.content || ''
  const tokensUsed = data.usage?.total_tokens || 0

  // Parse JSON, with one retry-via-reprompt if it fails
  let parsed: StartupAnalysis
  try {
    parsed = JSON.parse(stripCodeFences(rawText))
  } catch {
    parsed = await retryJsonParse(rawText, systemPrompt, userPrompt)
  }

  return { 
    analysis: { ...parsed, generatedAt: new Date().toISOString() }, 
    tokensUsed 
  }
}

function stripCodeFences(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
}

async function retryJsonParse(
  badResponse: string,
  systemPrompt: string,
  userPrompt: string
): Promise<StartupAnalysis> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_FAST_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: badResponse },
        { role: 'user', content: 'That was not valid JSON. Return ONLY the JSON object, nothing else.' },
      ],
      temperature: 0,
      max_tokens: 1500,
    }),
  })
  const data = await response.json() as any
  return JSON.parse(stripCodeFences(data.choices?.[0]?.message?.content || '{}'))
}

// ── MAIN ENTRY POINT ──────────────────────────────
export async function researchStartup(params: {
  startupId?: string
  applicationId?: string
  startupName: string
  websiteUrl: string
  triggeredBy: string
  forceRefresh?: boolean
}): Promise<{ 
  analysis: StartupAnalysis
  cached: boolean
  warnings: string[]
}> {
  const startTime = Date.now()
  const warnings: string[] = []

  // Check cache
  if (!params.forceRefresh && params.startupId) {
    const existing = await prisma.startup.findUnique({
      where: { id: params.startupId },
      select: { aiAnalysis: true, aiAnalyzedAt: true, aiSourceUrl: true },
    })
    if (
      existing?.aiAnalyzedAt &&
      existing.aiSourceUrl === params.websiteUrl &&
      Date.now() - existing.aiAnalyzedAt.getTime() < CACHE_HOURS * 3600000
    ) {
      return { 
        analysis: existing.aiAnalysis as unknown as StartupAnalysis, 
        cached: true, 
        warnings: [] 
      }
    }
  }

  // Step 1: crawl
  const { markdown, error: crawlError } = await crawlWebsite(params.websiteUrl)
  if (crawlError) {
    warnings.push(`Could not crawl website directly: ${crawlError}. Relying on web search only.`)
  }

  // Step 2: synthesize (online search fills gaps even if crawl failed)
  let analysis: StartupAnalysis
  let tokensUsed = 0
  let status = 'SUCCESS'
  let errorMessage: string | null = null

  try {
    const result = await synthesizeAnalysis(
      params.startupName, params.websiteUrl, markdown
    )
    analysis = result.analysis
    tokensUsed = result.tokensUsed
    if (crawlError) status = 'PARTIAL'
  } catch (err) {
    status = 'FAILED'
    errorMessage = err instanceof Error ? err.message : 'Unknown error'
    throw err
  } finally {
    await prisma.aiResearchLog.create({
      data: {
        startupId: params.startupId,
        applicationId: params.applicationId,
        triggeredBy: params.triggeredBy,
        sourceUrl: params.websiteUrl,
        openrouterModel: process.env.OPENROUTER_ONLINE_MODEL || 'openai/gpt-3.5-turbo',
        tokensUsed,
        latencyMs: Date.now() - startTime,
        status,
        errorMessage,
      },
    })
  }

  // Save to startup if we have an id
  if (params.startupId) {
    await prisma.startup.update({
      where: { id: params.startupId },
      data: {
        aiAnalysis: analysis as any,
        aiAnalyzedAt: new Date(),
        aiSourceUrl: params.websiteUrl,
        aiModelVersion: process.env.OPENROUTER_ONLINE_MODEL || 'openai/gpt-3.5-turbo',
      },
    })
  }

  return { analysis, cached: false, warnings }
}
