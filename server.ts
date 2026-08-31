import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "25mb" }));

  // API Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.7-flash",
    });
  });

  // Real-time Chat Stream Endpoint with Gemini
  app.post("/api/chat/stream", async (req: Request, res: Response): Promise<void> => {
    const { messages, datasetContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    const ai = getGenAI();

    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    if (!ai) {
      // Stream a fallback explanation and signal client-side intelligence fallback
      const fallbackNotice =
        "ℹ️ **Real-Time Data Intelligence Agent**: Server API key is not configured. Falling back to internal heuristic analytics engine.";
      res.write(`data: ${JSON.stringify({ chunk: fallbackNotice })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, fallback: true })}\n\n`);
      res.end();
      return;
    }

    try {
      // Build system instruction and context
      const systemInstruction = `You are InsightAI's Real-Time Data Intelligence & Decision Science Agent.
You are an expert data scientist, business intelligence strategist, machine learning consultant, and statistician.
You have access to the user's currently active dataset and analytics session.

CONTEXT ABOUT THE CURRENT DATASET:
${datasetContext ? JSON.stringify(datasetContext, null, 2) : "No specific dataset context provided."}

YOUR CAPABILITIES & GUIDELINES:
1. Provide accurate, mathematically sound, actionable insights grounded in the dataset context above.
2. If asked to compute or explain statistics, reference exact column names, means, medians, correlation values, and distributions.
3. If asked about Machine Learning, suggest appropriate target variables, problem types (Classification vs Regression), feature importance, and performance trade-offs.
4. If asked about Forecasting or Business Strategy, offer clear strategic recommendations with risk management frameworks.
5. Format your answers clearly using Markdown: bold headers, bullet lists, code blocks or tables when helpful, and key metric callouts.
6. Keep answers concise, executive-ready, and highly engaging.
7. Be proactive: after answering, suggest 2-3 relevant analytical follow-ups or action steps in this tool.`;

      // Transform messages into contents format for generateContentStream
      // The last message is the new user prompt; prior messages provide conversational history
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.7-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Gemini stream error:", error);
      const errorMessage = error?.message || "An error occurred while streaming the AI response.";
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  });

  // Non-streaming fallback endpoint
  app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
    const { messages, datasetContext } = req.body;

    const ai = getGenAI();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured.",
        fallback: true,
      });
      return;
    }

    try {
      const systemInstruction = `You are InsightAI's Real-Time Data Intelligence & Decision Science Agent.
Dataset Context:
${datasetContext ? JSON.stringify(datasetContext, null, 2) : "None"}
Provide clear, expert, actionable insights in Markdown.`;

      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`InsightAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
