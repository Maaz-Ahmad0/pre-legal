import { NextRequest, NextResponse } from "next/server";
import {
  legalTemplates,
  COMMON_UNSUPPORTED_DOCUMENTS,
  findClosestTemplate,
  getTemplateById,
  LegalTemplate,
} from "@/lib/prelegal";

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  currentDocument?: {
    templateId?: string;
    title?: string;
    values?: Record<string, string>;
  };
  openRouterApiKey?: string;
  openRouterModel?: string;
}

const TEMPLATE_SUMMARY = legalTemplates
  .map(
    (t) =>
      `- ID: "${t.id}" | Name: "${t.name}" | Category: ${t.category}\n  Description: ${t.description}\n  Fields: ${t.fields.map((f) => `${f.id} (${f.label}, type: ${f.type})`).join(", ")}`
  )
  .join("\n\n");

function buildSystemPrompt(activeTemplate?: LegalTemplate, currentValues?: Record<string, string>) {
  return `You are Pre-Legal AI, an intelligent legal assistant for generating standard commercial agreements.
Your task is to have a natural, free-form conversation with the user:
1. Understand what legal document they need.
2. If they ask for an UNSUPPORTED document (such as an Employment Contract, Residential Lease, Will, Personal Loan, Clickwrap Terms of Service, Divorce, Promissory Note, etc.):
   - State clearly and politely that Pre-Legal cannot generate that specific document because Pre-Legal specializes in standard B2B commercial agreements.
   - Offer the closest supported agreement(s) in our catalog (e.g. recommend Professional Services Agreement for independent contractors/consultants, Cloud Service Agreement for SaaS/software terms, Data Processing Agreement for privacy data handling, Pilot Agreement for product evaluations, etc.).
3. When a supported document is agreed upon or currently active:
   - Guide the user by asking natural, conversational questions about the document and its fields.
   - Do NOT interrogate the user with a rigid list of dry questions. Speak naturally, ask 1 or 2 relevant questions at a time based on what is still missing.
   - EXTRACT every field answer they give (such as party names, companies, effective date, governing law, jurisdiction, term, fees, purpose, scope) and return it in the JSON fieldUpdates.
   - If the user says "Change governing law to California" or "Set party 1 to Acme Inc", update those fields immediately.

SUPPORTED TEMPLATES IN OUR CATALOG:
${TEMPLATE_SUMMARY}

CURRENT STATE:
Active Template: ${activeTemplate ? `${activeTemplate.name} (${activeTemplate.id})` : "None selected yet"}
Current Field Values: ${JSON.stringify(currentValues || {})}

OUTPUT FORMAT INSTRUCTION:
You MUST respond with a valid JSON object only (no other wrapper text outside the JSON). The JSON must adhere to this schema:
{
  "reply": "Your conversational message to the user here. Markdown is supported in reply.",
  "templateId": "optional template ID to activate or switch to, or null if keeping current",
  "title": "optional updated title for the document, or null",
  "fieldUpdates": {
    "fieldId": "extracted value"
  },
  "unsupportedDetected": true or false,
  "closestTemplateId": "optional closest template ID if unsupported"
}
`;
}

// Built-in intelligent assistant fallback when OpenRouter API key is not configured or fails
function fallbackGenerateReply(
  userMessage: string,
  activeTemplate?: LegalTemplate,
  currentValues: Record<string, string> = {}
) {
  const match = findClosestTemplate(userMessage);

  // Check if user requested an unsupported document
  if (!match.isSupported && match.unsupportedInfo) {
    const closest = legalTemplates.find((t) => t.id === match.unsupportedInfo?.closestTemplateId);
    return {
      reply: `${match.unsupportedInfo.explanation}\n\n**Closest Match:** However, we do support the **${closest?.name || "Professional Services Agreement"}**.\n\n${match.unsupportedInfo.suggestedAction}\n\nWould you like to start that template instead?`,
      templateId: null,
      title: null,
      fieldUpdates: {},
      unsupportedDetected: true,
      closestTemplateId: match.unsupportedInfo.closestTemplateId,
    };
  }

  // If user mentions a supported template or wants to switch
  const mentionedTemplate = match.template;
  let targetTemplate = activeTemplate;
  let templateIdUpdate: string | null = null;
  let titleUpdate: string | null = null;

  if (
    mentionedTemplate &&
    (!activeTemplate || userMessage.toLowerCase().includes("instead") || userMessage.toLowerCase().includes("switch to") || userMessage.toLowerCase().includes("create a") || userMessage.toLowerCase().includes("new ") || userMessage.toLowerCase().includes("start "))
  ) {
    targetTemplate = mentionedTemplate;
    templateIdUpdate = mentionedTemplate.id;
    titleUpdate = `${mentionedTemplate.name} Draft`;
  }

  if (!targetTemplate) {
    targetTemplate = legalTemplates[0]; // Mutual NDA default
    templateIdUpdate = targetTemplate.id;
    titleUpdate = `${targetTemplate.name} Draft`;
  }

  // Field extraction heuristics from user free-form answer
  const fieldUpdates: Record<string, string> = {};
  const lower = userMessage.toLowerCase();

  // Extract parties (e.g., "between Acme and Beta", "party 1 is X, party 2 is Y", "client is X, provider is Y")
  const betweenMatch = userMessage.match(/between\s+([A-Za-z0-9\s.,]+?)\s+(?:and|&)\s+([A-Za-z0-9\s.,]+?)(?:\.|\,|$|\s+for|\s+with|\s+effective)/i);
  if (betweenMatch) {
    const party1 = betweenMatch[1].trim();
    const party2 = betweenMatch[2].trim();
    if (targetTemplate.fields.some((f) => f.id === "partyA")) fieldUpdates.partyA = party1;
    if (targetTemplate.fields.some((f) => f.id === "partyB")) fieldUpdates.partyB = party2;
    if (targetTemplate.fields.some((f) => f.id === "provider")) fieldUpdates.provider = party1;
    if (targetTemplate.fields.some((f) => f.id === "customer")) fieldUpdates.customer = party2;
    if (targetTemplate.fields.some((f) => f.id === "client")) fieldUpdates.client = party1;
    if (targetTemplate.fields.some((f) => f.id === "party1Company")) fieldUpdates.party1Company = party1;
    if (targetTemplate.fields.some((f) => f.id === "party2Company")) fieldUpdates.party2Company = party2;
    if (targetTemplate.fields.some((f) => f.id === "company")) fieldUpdates.company = party1;
    if (targetTemplate.fields.some((f) => f.id === "partner")) fieldUpdates.partner = party2;
  }

  // Specific single party mentions
  const clientMatch = userMessage.match(/(?:client|customer)\s+(?:is|name\s+is|:)\s*([A-Za-z0-9\s.,]+?)(?:[.,;]|$)/i);
  if (clientMatch) {
    const val = clientMatch[1].trim();
    if (targetTemplate.fields.some((f) => f.id === "client")) fieldUpdates.client = val;
    if (targetTemplate.fields.some((f) => f.id === "customer")) fieldUpdates.customer = val;
    if (targetTemplate.fields.some((f) => f.id === "partyA")) fieldUpdates.partyA = val;
  }

  const providerMatch = userMessage.match(/(?:provider|vendor|consultant)\s+(?:is|name\s+is|:)\s*([A-Za-z0-9\s.,]+?)(?:[.,;]|$)/i);
  if (providerMatch) {
    const val = providerMatch[1].trim();
    if (targetTemplate.fields.some((f) => f.id === "provider")) fieldUpdates.provider = val;
    if (targetTemplate.fields.some((f) => f.id === "vendor")) fieldUpdates.vendor = val;
    if (targetTemplate.fields.some((f) => f.id === "partyB")) fieldUpdates.partyB = val;
  }

  // Extract governing law (e.g. "governing law is California" or "Delaware law")
  const lawMatch =
    userMessage.match(/(?:governing\s+law|state\s+of|laws\s+of)\s+(?:is\s+)?([A-Za-z\s]+?)(?:[.,;]|$)/i) ||
    userMessage.match(/\b(Delaware|California|New York|Texas|Florida|Washington|Nevada|Illinois|Massachusetts|United Kingdom|Ireland)\b/i);
  if (lawMatch) {
    const law = lawMatch[1].trim();
    if (targetTemplate.fields.some((f) => f.id === "law")) fieldUpdates.law = law;
    if (targetTemplate.fields.some((f) => f.id === "governingLaw")) fieldUpdates.governingLaw = law;
  }

  // Extract purpose / services / scope
  const purposeMatch = userMessage.match(/(?:purpose|reason|scope|services)\s+(?:is|are|of|to)\s+([^.]+)/i);
  if (purposeMatch) {
    const purposeText = purposeMatch[1].trim();
    if (targetTemplate.fields.some((f) => f.id === "purpose")) fieldUpdates.purpose = purposeText;
    if (targetTemplate.fields.some((f) => f.id === "services")) fieldUpdates.services = purposeText;
    if (targetTemplate.fields.some((f) => f.id === "pilotScope")) fieldUpdates.pilotScope = purposeText;
    if (targetTemplate.fields.some((f) => f.id === "processingPurpose")) fieldUpdates.processingPurpose = purposeText;
  }

  // Extract term / duration
  const termMatch = userMessage.match(/(\d+\s+(?:year|years|month|months|days))/i);
  if (termMatch) {
    const termVal = termMatch[1].trim();
    if (targetTemplate.fields.some((f) => f.id === "term")) fieldUpdates.term = termVal;
    if (targetTemplate.fields.some((f) => f.id === "subscriptionPeriod")) fieldUpdates.subscriptionPeriod = termVal;
    if (targetTemplate.fields.some((f) => f.id === "duration")) fieldUpdates.duration = termVal;
  }

  // Compute merged values
  const merged = { ...currentValues, ...fieldUpdates };

  // Find remaining missing required fields
  const missing = targetTemplate.fields.filter(
    (f) => !merged[f.id] || merged[f.id].trim() === ""
  );

  let replyText = "";
  const updatedCount = Object.keys(fieldUpdates).length;

  if (templateIdUpdate && templateIdUpdate !== activeTemplate?.id) {
    replyText += `I've opened the **${targetTemplate.name}** for you.\n\n`;
  }

  if (updatedCount > 0) {
    const updatedNames = Object.keys(fieldUpdates)
      .map((k) => targetTemplate?.fields.find((f) => f.id === k)?.label || k)
      .join(", ");
    replyText += `Great! I have populated: **${updatedNames}**.\n\n`;
  }

  if (missing.length > 0) {
    const nextField = missing[0];
    replyText += `Next question: What is the **${nextField.label}**? ${nextField.placeholder ? `(e.g., "${nextField.placeholder}")` : ""}`;
    if (missing.length > 1) {
      replyText += `\n\n*(We also need: ${missing.slice(1, 3).map((f) => f.label).join(", ")})*`;
    }
  } else {
    replyText += `All key fields for this **${targetTemplate.name}** are populated! You can review the draft in the live preview on the right, download the Markdown document, or tell me if you'd like to adjust any terms.`;
  }

  return {
    reply: replyText,
    templateId: templateIdUpdate,
    title: titleUpdate,
    fieldUpdates,
    unsupportedDetected: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { messages, currentDocument, openRouterApiKey, openRouterModel } = body;

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    const activeTemplate = currentDocument?.templateId
      ? getTemplateById(currentDocument.templateId)
      : undefined;

    // Determine OpenRouter API Key
    const apiKey =
      openRouterApiKey?.trim() ||
      process.env.OPENROUTER_API_KEY?.trim() ||
      req.headers.get("x-openrouter-key")?.trim();

    const model =
      openRouterModel?.trim() ||
      process.env.OPENROUTER_MODEL?.trim() ||
      "openai/gpt-4o-mini";

    // If an OpenRouter API key is available, call OpenRouter
    if (apiKey) {
      try {
        const systemPrompt = buildSystemPrompt(activeTemplate, currentDocument?.values);

        const openRouterResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": "https://pre-legal.internal",
              "X-Title": "Pre-Legal Document Creator",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              response_format: { type: "json_object" },
              temperature: 0.3,
            }),
          }
        );

        if (openRouterResponse.ok) {
          const completion = await openRouterResponse.json();
          const rawContent = completion.choices?.[0]?.message?.content;

          if (rawContent) {
            try {
              const parsed = JSON.parse(rawContent);
              return NextResponse.json({
                reply: parsed.reply || rawContent,
                templateId: parsed.templateId || null,
                title: parsed.title || null,
                fieldUpdates: parsed.fieldUpdates || {},
                unsupportedDetected: parsed.unsupportedDetected || false,
                closestTemplateId: parsed.closestTemplateId || null,
                modelUsed: completion.model || model,
              });
            } catch (err) {
              console.warn("Could not parse JSON from OpenRouter, returning fallback text", err);
              return NextResponse.json({
                reply: rawContent,
                templateId: null,
                title: null,
                fieldUpdates: {},
                modelUsed: model,
              });
            }
          }
        } else {
          const errorText = await openRouterResponse.text();
          console.error("OpenRouter API error response:", openRouterResponse.status, errorText);
          // Graceful fallback if API key quota or error occurred
        }
      } catch (apiError) {
        console.error("Error communicating with OpenRouter:", apiError);
      }
    }

    // Fallback: Smart local rule-based assistant
    const fallbackResult = fallbackGenerateReply(
      lastUserMessage,
      activeTemplate,
      currentDocument?.values
    );

    return NextResponse.json({
      ...fallbackResult,
      modelUsed: apiKey ? `${model} (fallback)` : "Built-in Legal Assistant",
      apiKeyConfigured: Boolean(apiKey),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
        reply: "I ran into an issue processing your request. Please try again or pick a template directly.",
        fieldUpdates: {},
      },
      { status: 500 }
    );
  }
}
