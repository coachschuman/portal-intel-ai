
// Optimized for High-Performance Elite Scouting Intelligence with Robust Retry Logic
import { GoogleGenAI, GenerateContentResponse, Modality, Type, Chat, ThinkingLevel } from "@google/genai";
import { Player, GroundingSource, ForumPost, SavedTrend, NewsItem, NILDeal, ProgramBlueprint, NFLDraftProspect } from '../types';

/**
 * Initializes a new instance of GoogleGenAI using the API key from environment variables.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Simple in-memory cache to prevent hitting rate limits on every component mount.
 */
const intelCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 20 * 60 * 1000; 

/**
 * Helper to handle API retries with exponential backoff for 429 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message?.toLowerCase() || "";
    const isQuotaError = errorMsg.includes('429') || 
                         errorMsg.includes('quota') || 
                         errorMsg.includes('limit exceeded') || 
                         errorMsg.includes('resource_exhausted');
    
    if (isQuotaError && retries > 0) {
      console.warn(`System burst limit reached. Pausing for ${delay}ms before auto-resume... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const extractSources = (response: GenerateContentResponse): GroundingSource[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  
  return chunks
    .map(chunk => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : undefined)
    .filter((s): s is GroundingSource => !!s);
};

const cleanJson = (text: string) => {
  if (!text) return "{\"players\":[]}";
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.search(/\{|\[/);
  const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

const PLAYER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    players: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          position: { type: Type.STRING },
          stars: { type: Type.NUMBER },
          highSchool: { type: Type.STRING },
          previousSchool: { type: Type.STRING },
          state: { type: Type.STRING },
          classYear: { type: Type.STRING },
          predictedDestination: { type: Type.STRING },
          summary: { type: Type.STRING },
          stats: { type: Type.STRING },
          nilValue: { type: Type.STRING },
          physicalTraits: { type: Type.STRING },
          draftEligibility: { type: Type.STRING },
          draftProjection: { type: Type.STRING },
          commitment: {
            type: Type.OBJECT,
            properties: {
              schoolName: { type: Type.STRING },
              commitmentDate: { type: Type.STRING }
            }
          },
          capabilities: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "position", "stars", "summary"]
      }
    }
  },
  required: ["players"]
};

/**
 * NEW: getFullNFLDraftBoard
 * Fetches the overall 1-257 consensus draft big board.
 */
export const getFullNFLDraftBoard = async (classYear: string): Promise<{ prospects: NFLDraftProspect[], sources: GroundingSource[] }> => {
  const ai = getAiClient();
  const prompt = `Perform an OVERALL NFL DRAFT BIG BOARD PREDICTION for Class of ${classYear}.
  
  GOAL: Provide a consensus ranking from 1 to 257.
  
  SCRAPE AND SYNTHESIZE FROM:
  - NFL Mock Draft Database Overall Consensus
  - PFF Overall Big Board
  - WalterFootball Overall Rankings
  - ESPN/Kiper/Miller Big Boards
  - YouTube (for highlight links)
  
  RETURN JSON ONLY:
  {
    "prospects": [
      {
        "consensusRank": number,
        "name": string,
        "school": string,
        "position": string,
        "projectedRound": string,
        "pffGrade": string,
        "kiperTake": string,
        "nflComparison": string,
        "summary": string,
        "videoLinks": [{"title": string, "url": string}]
      }
    ]
  }
  
  Provide the Top 100 prospects in high-fidelity JSON. For each prospect, try to include 1-2 verified highlight or film links.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  }));

  const jsonStr = cleanJson(response.text || '{"prospects":[]}');
  const data = JSON.parse(jsonStr);
  const sources = extractSources(response);

  const prospects = (data.prospects || []).map((p: any, i: number) => ({
    ...p,
    id: `full-nfl-${classYear}-${i}`,
    classYear,
    sources
  }));

  return { prospects, sources };
};

/**
 * NEW: scanNFLDraft
 * Performs free-form intelligence scans for NFL Draft prospects.
 */
export const scanNFLDraft = async (query: string): Promise<{ prospects: NFLDraftProspect[], sources: GroundingSource[] }> => {
  const ai = getAiClient();
  const prompt = `Perform an ADVANCED NFL DRAFT SCAN for query: "${query}".
  
  SCRAPE AND SYNTHESIZE FROM:
  - PFF (Pro Football Focus)
  - NFL.com / Bucky Brooks / Daniel Jeremiah
  - ESPN / Mel Kiper Jr. / Matt Miller
  - NFL Mock Draft Database
  - The Draft Network
  
  RETURN JSON ONLY:
  {
    "prospects": [
      {
        "name": string,
        "school": string,
        "position": string,
        "projectedRound": string,
        "consensusRank": number,
        "pffGrade": string,
        "kiperTake": string,
        "walterFootballRank": string,
        "mockDraftDbRank": string,
        "physicalTraits": string,
        "nflComparison": string,
        "summary": string,
        "strengths": string[],
        "weaknesses": string[],
        "videoLinks": [{"title": string, "url": string}]
      }
    ]
  }
  
  Provide the top 10 relevant prospects. Include film links if available.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  }));

  const jsonStr = cleanJson(response.text || '{"prospects":[]}');
  const data = JSON.parse(jsonStr);
  const sources = extractSources(response);

  const prospects = (data.prospects || []).map((p: any, i: number) => ({
    ...p,
    id: `scan-nfl-${Date.now()}-${i}`,
    sources
  }));

  return { prospects, sources };
};

/**
 * Specialized NFL Draft Intelligence Grounding
 * Aggregates PFF, ESPN (Kiper/McShay), WalterFootball, CBS, and NFL Mock Draft Database.
 */
export const getNFLDraftIntelligence = async (position: string, classYear: string): Promise<{ prospects: NFLDraftProspect[], sources: GroundingSource[] }> => {
  const ai = getAiClient();
  const prompt = `Perform an ELITE NFL DRAFT AUDIT for Class of ${classYear}, Position: ${position}.
  
  MANDATORY DATA SOURCES TO SCAN:
  - Pro Football Focus (PFF) Grades
  - ESPN.com (Mel Kiper Jr. & Todd McShay Analysis)
  - NFL Mock Draft Database (https://www.nflmockdraftdatabase.com/big-boards/${classYear}/consensus-big-board-${classYear})
  - WalterFootball.com rankings
  - CBS Sports & Bleacher Report Draft Boards
  - NFL Draft Scout & NFL Draft Diamonds
  - AllAccessFootball 2026 Rankings
  
  RETURN ONLY JSON structure:
  {
    "prospects": [
      {
        "name": string,
        "school": string,
        "position": string,
        "projectedRound": string,
        "consensusRank": number,
        "pffGrade": string,
        "kiperTake": string,
        "walterFootballRank": string,
        "mockDraftDbRank": string,
        "physicalTraits": string,
        "nflComparison": string,
        "summary": string,
        "strengths": string[],
        "weaknesses": string[],
        "videoLinks": [{"title": string, "url": string}]
      }
    ]
  }
  
  Analyze the Top 10 prospects for this position. Synthesize conflicting rankings into a consensus rank. Include film study links for the breakout panel.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  }));

  const jsonStr = cleanJson(response.text || '{"prospects":[]}');
  const data = JSON.parse(jsonStr);
  const sources = extractSources(response);

  const prospects = (data.prospects || []).map((p: any, i: number) => ({
    ...p,
    id: `nfl-${classYear}-${position}-${i}`,
    classYear,
    sources
  }));

  return { prospects, sources };
};

/**
 * NEW: getNFLDraftComparison
 * Generates AI-driven comparative analysis for draft prospects.
 */
export const getNFLDraftComparison = async (prospects: NFLDraftProspect[], needs: string): Promise<{ text: string, sources: GroundingSource[] }> => {
  const ai = getAiClient();
  const names = prospects.map(p => `${p.name} (${p.position}, ${p.school})`).join(', ');
  const prompt = `Perform an ELITE STRATEGIC COMPARISON for these NFL Draft prospects: ${names}.
  
  CONTEXT: Analyze their potential scheme fits and specific roles at the pro level.
  ADDITIONAL STAFF NEEDS: ${needs}
  
  COMPARISON REQUIREMENTS:
  1. Identify technical differences in their play styles (e.g., Gap vs Zone blocker, Man vs Zone corner).
  2. Synthesize PFF grades and consensus rankings to highlight the "Value Floor" vs "Athletic Ceiling".
  3. Determine the specific NFL Scheme (West Coast, Air Coryell, Fangio Defense, etc.) where each asset provides maximum ROI.
  4. Provide a "War Room Verdict" on which prospect best solves the stated staff needs.
  
  Return the report in high-fidelity markdown with headers and structured bullet points.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  }));

  return { text: response.text || "Comparison synthesis failed.", sources: extractSources(response) };
};

export const getPortalMarketPulse = async (forceRefresh: boolean = false): Promise<any> => {
  if (!forceRefresh && intelCache['pulse'] && (Date.now() - intelCache['pulse'].timestamp < CACHE_TTL)) {
    return intelCache['pulse'].data;
  }

  const ai = getAiClient();
  const prompt = `Perform a GLOBAL MARKET AUDIT of the 2026 CFB Transfer Portal. Return ONLY JSON: { "totalEstimatedEntries": number, "eliteAssetsAvailable": number, "scarcityReport": [ { "position": string, "scarcityLevel": "High"|"Medium"|"Low", "summary": string } ], "marketVelocity": [ { "school": string, "trend": "Bleeding"|"Gaining", "count": number } ] }`;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    }));

    const data = JSON.parse(cleanJson(response.text || "{}"));
    if (!data.scarcityReport) data.scarcityReport = [];
    if (!data.marketVelocity) data.marketVelocity = [];

    intelCache['pulse'] = { data, timestamp: Date.now() };
    return data;
  } catch (e) {
    console.error("Pulse Relay Error:", e);
    return { totalEstimatedEntries: "SYNC", eliteAssetsAvailable: "SYNC", scarcityReport: [], marketVelocity: [] };
  }
};

export const getDailyPortalNews = async (forceRefresh: boolean = false): Promise<NewsItem[]> => {
  if (!forceRefresh && intelCache['news'] && (Date.now() - intelCache['news'].timestamp < CACHE_TTL)) {
    return intelCache['news'].data;
  }

  const ai = getAiClient();
  const prompt = `Return a JSON list of 3 latest 2026 Transfer Portal news items. JSON structure: Array<{ title, summary, source, url, urgency: "Low"|"Medium"|"High" }>`;
  
  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt, 
      config: { tools: [{ googleSearch: {} }] } 
    }));

    const items = JSON.parse(cleanJson(response.text || "[]"));
    const sources = extractSources(response);
    const data = items.map((item: any, i: number) => ({ 
      ...item, 
      id: `news-${Date.now()}-${i}`, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: sources
    }));

    intelCache['news'] = { data, timestamp: Date.now() };
    return data;
  } catch (e) {
    console.error("News Relay Error:", e);
    throw new Error("Relay failure");
  }
};

export const analyzeProgramFit = async (player: Player, blueprint: ProgramBlueprint): Promise<{ text: string, score: number, sources: GroundingSource[] }> => {
  const ai = getAiClient();
  const prompt = `Perform an ELITE PROGRAM ALIGNMENT AUDIT for ${player.name} (${player.position}) at ${blueprint.schoolName}.
  
  Audit requirements:
  1. Compare the prospect's grounded production data with the school's scheme needs.
  2. Determine a numerical "Program Alignment Score" (0-100).
  3. Identify potential ROI (Return on Intel) and cultural fit risk.
  4. Return the report in high-fidelity markdown.
  
  CRITICAL: End your report with exactly "PROGRAM_ALIGNMENT_SCORE: [number]" on the last line.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  }));

  const text = response.text || "";
  let score = 70;
  const scoreMatch = text.match(/PROGRAM_ALIGNMENT_SCORE:\s*(\d+)/);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1]);
  }

  return { text, score, sources: extractSources(response) };
};

export const getSocialIntelligenceAudit = async (prospectName: string, context?: string): Promise<{ text: string, sources: GroundingSource[], buzzScore: number, sentiment: 'Positive' | 'Neutral' | 'Mixed' | 'Volatile' }> => {
  const ai = getAiClient();
  const prompt = `Deep social audit for prospect: "${prospectName}". Identify Twitter, Reddit, and IG discourse. Assign a numerical Buzz Score (0-100) and Sentiment.`;
  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  }));
  const text = response.text || "";
  let buzzScore = 50;
  const match = text.match(/Buzz Score:\s*(\d+)/);
  if (match) buzzScore = parseInt(match[1]);
  let sentiment: any = 'Neutral';
  if (text.toLowerCase().includes('positive')) sentiment = 'Positive';
  else if (text.toLowerCase().includes('volatile')) sentiment = 'Volatile';
  else if (text.toLowerCase().includes('mixed')) sentiment = 'Mixed';
  return { text, sources: extractSources(response), buzzScore, sentiment };
};

export const scanHSRecruiting = async (query: string, filters: any = {}, useThinking: boolean = true) => {
  const ai = getAiClient();
  const prompt = `Elite HS Recruiting Analyst Scan: ${query}. Return JSON matching schema. Context: Class of ${filters.classYear}, State: ${filters.state}, Position: ${filters.position}.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json", 
      responseSchema: PLAYER_SCHEMA,
      thinkingConfig: useThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined 
    }
  }));

  const jsonStr = cleanJson(response.text || '{"players":[]}');
  const players = JSON.parse(jsonStr).players.map((p: any, i: number) => ({ 
    ...p, id: `hs-${Date.now()}-${i}`, recruitingType: 'HS', lastUpdated: new Date().toLocaleDateString() 
  }));
  
  return { text: response.text || "", players, sources: extractSources(response) };
};

export const scanTransferPortal = async (query: string = "", isFast: boolean = false) => {
  const ai = getAiClient();
  const prompt = `Transfer Portal Specialist Scan: "${query}". Return JSON matching schema.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: isFast ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json", 
      responseSchema: PLAYER_SCHEMA,
      thinkingConfig: !isFast ? { thinkingLevel: ThinkingLevel.HIGH } : undefined 
    }
  }));

  const jsonStr = cleanJson(response.text || '{"players":[]}');
  const players = JSON.parse(jsonStr).players.map((p: any, i: number) => ({ 
    ...p, id: `gen-${Date.now()}-${i}`, lastUpdated: new Date().toLocaleDateString(), recruitingType: 'College' 
  }));
  
  return { text: response.text || "", players, sources: extractSources(response) };
};

export const chatWithIntel = async (history: any[], message: string, useThinking: boolean = true) => {
  const ai = getAiClient();
  const normalizedHistory = history.filter((item, idx) => {
    if (idx === 0 && item.role === 'model') return false; 
    return true;
  });

  const contents = [...normalizedHistory, { role: 'user', parts: [{ text: message }] }];

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: contents,
      config: { 
        tools: [{ googleSearch: {} }], 
        thinkingConfig: useThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
        systemInstruction: "You are 'Zephyr', an Elite CFB Recruiting Scout. Provide grounded intelligence on portal movements and prospect profiles. Keep responses concise and high-fidelity."
      }
    }));

    return { text: response.text || "Intelligence relay returned no data.", sources: extractSources(response) };
  } catch (err: any) {
    console.error("Chat Relay Error:", err);
    throw err;
  }
};

export const fastChatWithIntelStream = async (history: any[], message: string, onChunk: (t: string) => void) => {
  const ai = getAiClient();
  const normalizedHistory = history.filter((item, idx) => idx !== 0 || item.role !== 'model');
  const contents = [...normalizedHistory, { role: 'user', parts: [{ text: message }] }];

  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: "Fast Scout Mode: Concise intelligence on cfb recruiting."
    }
  });

  for await (const chunk of stream) {
    if (chunk.text) onChunk(chunk.text);
  }
};

export const getHSConsensusBigBoard = async (filters: any) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-pro-preview', 
    contents: `Rank the top 20 HS prospects for ${filters.classYear} in ${filters.state} for ${filters.position}. JSON ONLY.`, 
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json", 
      responseSchema: PLAYER_SCHEMA,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } 
    } 
  });
  const players = JSON.parse(cleanJson(response.text || '{"players":[]}')).players.map((p: any) => ({ ...p, id: `hs-rank-${Date.now()}-${p.name}`, recruitingType: 'HS', lastUpdated: new Date().toLocaleDateString() }));
  return { players, sources: extractSources(response) };
};

export const getConsensusBigBoard = async (filters?: any) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-pro-preview', 
    contents: `Rank the TOP 50 players in the 2026 Transfer Portal. JSON ONLY.`, 
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json", 
      responseSchema: PLAYER_SCHEMA,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } 
    } 
  });
  const players = JSON.parse(cleanJson(response.text || '{"players":[]}')).players.map((p: any) => ({ ...p, id: `rank-${Date.now()}-${p.name}`, lastUpdated: new Date().toLocaleDateString(), recruitingType: 'College' }));
  return { players, sources: extractSources(response) };
};

export const getPlayerDeepDive = async (player: Player) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-pro-preview', 
    contents: `Perform an ELITE 360 CAPABILITY AUDIT for ${player.name} (${player.position}). 
    
    FOCUS AREAS:
    1. PERFORMANCE METRICS: Analyze grounded production data, advanced stats (PFF grades, EPA, etc.), and physical testing numbers.
    2. SCHEME FIT: Identify the specific offensive/defensive systems where this asset provides maximum ROI (e.g., Wide Zone, Gap Power, Cover 3, etc.).
    3. TECHNICAL TRAITS: Breakdown specific technical skills (e.g., hand placement, route running nuances, gap discipline).
    
    Search for the latest 2025/2026 scouting reports and highlights to ensure high-fidelity grounding.`, 
    config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } 
  });
  return { text: response.text || "", sources: extractSources(response) };
};

export const generateScoutsTake = async (player: Player) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Most dominant athletic trait for ${player.name} based on scouting reports.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Analysis pending.";
};

export const getNewsDeepDive = async (newsItem: NewsItem) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Expand news: ${newsItem.title}. Identify affected rosters.`, config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } });
  return { text: response.text || "", sources: extractSources(response) };
};

export const getComparisonInsight = async (players: Player[], needs: string, blueprint?: ProgramBlueprint) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-pro-preview', 
    contents: `Compare these prospects: ${players.map(p=>p.name).join(', ')}. Program Needs: ${needs}.`, 
    config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } 
  });
  return response.text || "Comparison failed.";
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | undefined> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }
  return undefined;
};

export const generateAudioBlob = async (text: string, voiceName: string = 'Kore'): Promise<Blob> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Scouting Report: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  let base64Audio: string | undefined;
  for (const part of response.candidates?.[0]?.content?.parts || []) { if (part.inlineData?.data) { base64Audio = part.inlineData.data; break; } }
  if (!base64Audio) throw new Error("No audio generated");
  const pcmBytes = atob(base64Audio).split('').map(c => c.charCodeAt(0));
  const buffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(buffer);
  const writeS = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeS(0, 'RIFF'); view.setUint32(4, 36 + pcmBytes.length, true); writeS(8, 'WAVE'); writeS(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true); view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeS(36, 'data'); view.setUint32(40, pcmBytes.length, true);
  for (let i = 0; i < pcmBytes.length; i++) view.setUint8(44 + i, pcmBytes[i]);
  return new Blob([buffer], { type: 'audio/wav' });
};

export const generateScoutingEmail = async (players: Player[], title?: string): Promise<any> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-pro-preview', 
    contents: `Draft scouting email for: ${players.map(p => p.name).join(', ')}. JSON format with 'subject' and 'body'.`, 
    config: { 
      responseMimeType: "application/json", 
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      tools: [{ googleSearch: {} }]
    } 
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};
