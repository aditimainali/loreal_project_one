import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { buildAdvisorSystemPrompt } from "./src/utils/advisorPrompt.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface IncomingProduct {
  id: number;
  brand: string;
  name: string;
  category: string;
  description: string;
}

interface AdvisorRequestBody {
  messages?: IncomingMessage[];
  selectedProducts?: IncomingProduct[];
  webSearchEnabled?: boolean;
  language?: "en" | "ar";
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 15000,
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const errObj = error as Record<string, unknown>;
  if (typeof errObj.status === "number") return errObj.status;
  if (typeof errObj.code === "number") return errObj.code;
  if (typeof errObj.message === "string") {
    if (
      errObj.message.includes('"code":429') ||
      errObj.message.includes("RESOURCE_EXHAUSTED")
    ) {
      return 429;
    }
    if (
      errObj.message.includes('"code":403') ||
      errObj.message.includes("PERMISSION_DENIED")
    ) {
      return 403;
    }
    if (
      errObj.message.includes('"code":400') ||
      errObj.message.includes("API_KEY_INVALID")
    ) {
      return 400;
    }
    if (
      errObj.message.includes('"code":404') ||
      errObj.message.includes("NOT_FOUND")
    ) {
      return 404;
    }
    if (
      errObj.message.includes('"code":503') ||
      errObj.message.includes("UNAVAILABLE")
    ) {
      return 503;
    }
  }
  return undefined;
}

function isRetryableQuotaOrTransientError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 429 || status === 503 || status === 500) {
    return true;
  }
  const msg = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate") ||
    msg.includes("unavailable") ||
    msg.includes("503") ||
    msg.includes("aborted") ||
    msg.includes("timed out") ||
    msg.includes("timeout")
  );
}

function formatReadableError(error: unknown): { status: number; message: string } {
  const status = getErrorStatus(error) || 500;
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");

  if (status === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "The Gemini API quota or rate limit is currently exhausted (429). Please wait a few seconds and click Retry, or select a billing-enabled API key in Settings > Secrets.",
    };
  }

  if (
    status === 403 ||
    rawMessage.includes("PERMISSION_DENIED") ||
    rawMessage.includes("API_KEY_INVALID")
  ) {
    return {
      status: 403,
      message:
        "The Gemini API key appears invalid or lacks permission. Please verify your API key in Settings > Secrets.",
    };
  }

  if (rawMessage.includes("GEMINI_API_KEY is not configured")) {
    return {
      status: 500,
      message:
        "No Gemini API key is configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.",
    };
  }

  if (rawMessage.includes("timed out") || rawMessage.includes("aborted")) {
    return {
      status: 504,
      message:
        "The AI advisor took too long to respond (likely due to API rate limiting). Please try again.",
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: rawMessage || "Unable to reach the AI advisor service.",
  };
}

async function callGenerateWithTimeout(
  ai: GoogleGenAI,
  model: string,
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  systemInstruction: string,
  useSearch: boolean,
  timeoutMs: number
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const apiPromise = ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      abortSignal: controller.signal,
      ...(model === "gemini-4-hydrogen"
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
        : {}),
      ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });

  try {
    return await Promise.race([apiPromise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface LiveWebReference {
  title: string;
  uri: string;
  snippet: string;
}

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "LorealRoutineAdvisor/1.0",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLiveWebReferences(
  userQuery: string,
  selectedProducts: IncomingProduct[]
): Promise<LiveWebReference[]> {
  const refs: LiveWebReference[] = [];
  const seenUris = new Set<string>();

  const productSearchTerm =
    selectedProducts.length > 0
      ? `${selectedProducts[0].brand} ${selectedProducts[0].name}`
      : userQuery.slice(0, 80);

  const wikiTopicTerm =
    selectedProducts.length > 0
      ? `${selectedProducts[0].brand} ${selectedProducts[0].category}`
      : userQuery.slice(0, 80);

  const tasks: Array<Promise<void>> = [];

  // Query Open Beauty Facts for up to 2 selected products or user query
  const obfTargets =
    selectedProducts.length > 0
      ? selectedProducts.slice(0, 2).map((p) => `${p.brand} ${p.name}`)
      : [productSearchTerm];

  for (const term of obfTargets) {
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      term
    )}&search_simple=1&action=process&json=1&page_size=2`;
    tasks.push(
      fetchJsonWithTimeout(url).then((data: unknown) => {
        const products = (
          data as {
            products?: Array<{
              url?: string;
              product_name?: string;
              brands?: string;
              ingredients_text?: string;
            }>;
          }
        )?.products;
        if (!Array.isArray(products)) return;
        for (const item of products) {
          if (item?.url && !seenUris.has(item.url)) {
            seenUris.add(item.url);
            const title = [item.brands, item.product_name]
              .filter(Boolean)
              .join(" — ")
              .trim();
            refs.push({
              title: title ? `${title} (Open Beauty Facts)` : "Open Beauty Facts Product",
              uri: item.url,
              snippet: item.ingredients_text
                ? `Ingredients listed: ${item.ingredients_text.slice(0, 220)}`
                : "Product listing in Open Beauty Facts database.",
            });
            break;
          }
        }
      })
    );
  }

  // Query Wikipedia for ingredient / brand context
  const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    wikiTopicTerm
  )}&format=json&srlimit=2`;
  tasks.push(
    fetchJsonWithTimeout(wikiUrl).then((data: unknown) => {
      const results = (
        data as {
          query?: {
            search?: Array<{ title?: string; snippet?: string }>;
          };
        }
      )?.query?.search;
      if (!Array.isArray(results)) return;
      for (const entry of results) {
        if (!entry?.title) continue;
        const uri = `https://en.wikipedia.org/wiki/${encodeURIComponent(
          entry.title.replace(/ /g, "_")
        )}`;
        if (!seenUris.has(uri)) {
          seenUris.add(uri);
          refs.push({
            title: `${entry.title} — Wikipedia`,
            uri,
            snippet: entry.snippet ? stripHtmlTags(entry.snippet) : "",
          });
        }
      }
    })
  );

  await Promise.allSettled(tasks);
  return refs.slice(0, 5);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/advisor", async (req, res) => {
    try {
      const body = (req.body || {}) as AdvisorRequestBody;
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];
      const selectedProducts = Array.isArray(body.selectedProducts)
        ? body.selectedProducts
        : [];
      const webSearchEnabled = body.webSearchEnabled !== false;
      const language = body.language === "ar" ? "ar" : "en";

      if (rawMessages.length === 0) {
        res.status(400).json({ error: "Please provide at least one message." });
        return;
      }

      const systemInstruction = buildAdvisorSystemPrompt(
        selectedProducts,
        language
      );

      const configuredWorkerUrl = process.env.CLOUDFLARE_WORKER_URL?.trim();
      if (configuredWorkerUrl) {
        const workerMessages = [
          { role: "system" as const, content: systemInstruction },
          ...rawMessages
            .filter(
              (m) => typeof m.content === "string" && m.content.trim().length > 0
            )
            .map((m) => ({
              role: m.role,
              content: m.content.trim(),
            })),
        ];

        const workerController = new AbortController();
        const workerTimer = setTimeout(() => workerController.abort(), 20000);
        try {
          const workerRes = await fetch(configuredWorkerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: workerController.signal,
            body: JSON.stringify({
              model: "gpt-4.1",
              messages: workerMessages,
              webSearchEnabled,
            }),
          });
          const workerData = (await workerRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
            reply?: string;
            sources?: Array<{ title: string; uri: string }>;
            searchFallback?: boolean;
            error?: string;
          };
          if (!workerRes.ok) {
            throw new Error(
              workerData.error ||
                `Cloudflare Worker returned HTTP ${workerRes.status}`
            );
          }
          const workerReply =
            workerData.choices?.[0]?.message?.content?.trim() ||
            workerData.reply?.trim() ||
            "I could not generate a response right now. Please try again.";
          res.json({
            reply: workerReply,
            sources: Array.isArray(workerData.sources) ? workerData.sources : [],
            searchFallback: Boolean(workerData.searchFallback),
          });
          return;
        } finally {
          clearTimeout(workerTimer);
        }
      }

      const ai = getGeminiClient();

      const contents = rawMessages
        .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: [{ text: m.content.trim() }],
        }));

      const attempts: Array<{ model: string; useSearch: boolean; timeoutMs: number }> =
        webSearchEnabled
          ? [
              { model: "gemini-4-hydrogen", useSearch: true, timeoutMs: 8000 },
              { model: "gemini-3.1-flash-lite", useSearch: true, timeoutMs: 8000 },
            ]
          : [
              { model: "gemini-4-hydrogen", useSearch: false, timeoutMs: 10000 },
              { model: "gemini-3.1-flash-lite", useSearch: false, timeoutMs: 10000 },
            ];

      let response = null;
      let lastError: unknown = null;
      let searchFallback = false;
      let fallbackSources: Array<{ title: string; uri: string }> = [];

      for (const attempt of attempts) {
        try {
          response = await callGenerateWithTimeout(
            ai,
            attempt.model,
            contents,
            systemInstruction,
            attempt.useSearch,
            attempt.timeoutMs
          );
          break;
        } catch (err) {
          console.warn(
            `Advisor attempt failed (${attempt.model}, search=${attempt.useSearch}):`,
            err instanceof Error ? err.message : err
          );
          lastError = err;
          if (!isRetryableQuotaOrTransientError(err)) {
            throw err;
          }
        }
      }

      // If Google Search grounding hit quota/timeout while webSearchEnabled is on,
      // fetch real live web sources (Open Beauty Facts + Wikipedia) on the server
      // and run gemini-3.1-flash-lite with those verified live citations.
      if (!response && webSearchEnabled) {
        const latestUserText =
          rawMessages
            .slice()
            .reverse()
            .find((m) => m.role === "user")?.content || "";
        const liveRefs = await fetchLiveWebReferences(
          latestUserText,
          selectedProducts
        );

        const webContextBlock =
          liveRefs.length > 0
            ? `\n\nLIVE WEB SEARCH REFERENCES (Retrieved Now — cite relevant details and link naturally):\n${liveRefs
                .map(
                  (r, idx) =>
                    `[${idx + 1}] ${r.title} (${r.uri}): ${r.snippet}`
                )
                .join("\n")}`
            : "";

        try {
          response = await callGenerateWithTimeout(
            ai,
            "gemini-3.1-flash-lite",
            contents,
            `${systemInstruction}${webContextBlock}`,
            false,
            10000
          );
          if (liveRefs.length > 0) {
            fallbackSources = liveRefs.map((r) => ({
              title: r.title,
              uri: r.uri,
            }));
          } else {
            searchFallback = true;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!response) {
        throw lastError || new Error("Unable to generate routine response.");
      }

      const reply =
        response.text?.trim() ||
        "I could not generate a response right now. Please try again.";

      const rawChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const seenUris = new Set<string>();
      const sources: Array<{ title: string; uri: string }> = [];

      for (const chunk of rawChunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          sources.push({
            uri,
            title: title || new URL(uri).hostname,
          });
        }
      }

      for (const src of fallbackSources) {
        if (!seenUris.has(src.uri)) {
          seenUris.add(src.uri);
          sources.push(src);
        }
      }

      res.json({ reply, sources, searchFallback });
    } catch (error) {
      console.error("Advisor API error:", error);
      const formatted = formatReadableError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`L'Oréal Routine Advisor server running on http://localhost:${PORT}`);
  });
}

startServer();
