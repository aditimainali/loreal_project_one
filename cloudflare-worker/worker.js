/**
 * Cloudflare Worker for L'Oréal Smart Routine & Product Advisor
 *
 * Setup:
 *   1. Install Wrangler: npm install -g wrangler
 *   2. Authenticate: wrangler login
 *   3. Set your OpenAI API key as a Worker Secret:
 *        wrangler secret put OPENAI_API_KEY
 *   4. Deploy:
 *        wrangler deploy
 *
 * Returns standard OpenAI-compatible `{ choices: [{ message: { role, content } }], sources }`
 * while keeping OPENAI_API_KEY strictly on Cloudflare's edge.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function extractResponseCitations(responseJson) {
  const sources = [];
  const seen = new Set();
  const output = Array.isArray(responseJson?.output) ? responseJson.output : [];

  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      const annotations = Array.isArray(part?.annotations)
        ? part.annotations
        : [];
      for (const ann of annotations) {
        if (ann?.type === "url_citation" && ann?.url && !seen.has(ann.url)) {
          seen.add(ann.url);
          sources.push({
            uri: ann.url,
            title: ann.title || new URL(ann.url).hostname,
          });
        }
      }
    }
  }

  return sources;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "OPENAI_API_KEY secret is not configured on this Cloudflare Worker.",
        },
        500
      );
    }

    try {
      const body = await request.json();
      const messages = Array.isArray(body?.messages) ? body.messages : [];
      const model = typeof body?.model === "string" ? body.model : "gpt-4.1";
      const webSearchEnabled = Boolean(body?.webSearchEnabled);

      if (messages.length === 0) {
        return jsonResponse(
          { error: "Request must include a non-empty messages array." },
          400
        );
      }

      // LevelUp Web Search via OpenAI Responses API when webSearchEnabled is true
      if (webSearchEnabled) {
        try {
          const searchResp = await fetch(
            "https://api.openai.com/v1/responses",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                tools: [{ type: "web_search_preview" }],
                input: messages,
              }),
            }
          );

          if (searchResp.ok) {
            const searchData = await searchResp.json();
            const content =
              typeof searchData?.output_text === "string" &&
              searchData.output_text.trim().length > 0
                ? searchData.output_text.trim()
                : "";

            if (content) {
              const sources = extractResponseCitations(searchData);
              return jsonResponse({
                choices: [
                  {
                    message: {
                      role: "assistant",
                      content,
                    },
                  },
                ],
                sources,
              });
            }
          }
        } catch {
          // Fall through to standard Chat Completions API if web search is unavailable
        }
      }

      // Standard OpenAI Chat Completions API (gpt-4.1)
      const openaiResp = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
          }),
        }
      );

      const openaiData = await openaiResp.json();
      if (!openaiResp.ok) {
        return jsonResponse(
          {
            error:
              openaiData?.error?.message ||
              `OpenAI API error (${openaiResp.status})`,
          },
          openaiResp.status
        );
      }

      return jsonResponse({
        ...openaiData,
        sources: [],
        searchFallback: webSearchEnabled,
      });
    } catch (err) {
      return jsonResponse(
        {
          error:
            err instanceof Error
              ? err.message
              : "Unexpected Cloudflare Worker error.",
        },
        500
      );
    }
  },
};
