"use client";

import React, { useState, useRef, useEffect } from "react";
import { LegalTemplate, PreLegalDocument, legalTemplates, getTemplateById } from "@/lib/prelegal";

interface Message {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: string;
  fieldUpdates?: Record<string, string>;
  suggestedTemplateId?: string | null;
}

interface DocumentChatProps {
  activeDocument: PreLegalDocument | null;
  activeTemplate?: LegalTemplate;
  onUpdateDocument: (patch: Partial<PreLegalDocument>) => void;
  onSelectTemplate: (template: LegalTemplate) => void;
  openRouterApiKey?: string;
  onUpdateApiKey?: (key: string) => void;
  openRouterModel?: string;
}

export function DocumentChat({
  activeDocument,
  activeTemplate,
  onUpdateDocument,
  onSelectTemplate,
  openRouterApiKey = "",
  onUpdateApiKey,
  openRouterModel = "openai/gpt-4o-mini",
}: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your **Pre-Legal AI Assistant**.\n\nTell me what kind of legal agreement you'd like to draft or describe your situation (e.g. *\"I need an NDA for partnership discussions\"*, *\"Create a Cloud Service Agreement for my SaaS\"*, or *\"I need a Pilot Agreement\"*).\n\nI'll ask you a few friendly questions about the parties and terms, and populate the agreement in real time!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState(openRouterApiKey);
  const [selectedModel, setSelectedModel] = useState(openRouterModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          currentDocument: activeDocument
            ? {
                templateId: activeDocument.templateId,
                title: activeDocument.title,
                values: activeDocument.values,
              }
            : undefined,
          openRouterApiKey: customKey || undefined,
          openRouterModel: selectedModel,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      // If a template switch or activation occurred
      if (data.templateId && (!activeDocument || activeDocument.templateId !== data.templateId)) {
        const found = getTemplateById(data.templateId);
        if (found) {
          onSelectTemplate(found);
        }
      }

      // Apply field updates
      if (data.fieldUpdates && Object.keys(data.fieldUpdates).length > 0) {
        const currentVals = activeDocument?.values || {};
        const mergedVals = { ...currentVals, ...data.fieldUpdates };
        onUpdateDocument({
          values: mergedVals,
          title: data.title || activeDocument?.title,
        });
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "I've processed your response and updated the document.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fieldUpdates: data.fieldUpdates,
        suggestedTemplateId: data.closestTemplateId,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I encountered a temporary connection issue. Please make sure your OpenRouter API key is valid, or continue describing the document details.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    if (onUpdateApiKey) onUpdateApiKey(customKey);
    setShowSettings(false);
  };

  const quickPills = [
    "Mutual NDA for partnership",
    "Cloud Service Agreement (SaaS)",
    "Professional Services Agreement",
    "Data Processing Agreement (DPA)",
    "Pilot Agreement (Evaluation)",
    "Can you make an Employment Contract?",
  ];

  return (
    <div className="chat-shell">
      {/* Chat Header */}
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "999px",
              background: "var(--accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}
          >
            AI
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>Pre-Legal Legal Assistant</strong>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "999px",
                  background: "rgba(23, 107, 90, 0.12)",
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                OpenRouter
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
              {activeTemplate ? (
                <>
                  Drafting: <strong style={{ color: "var(--ink)" }}>{activeTemplate.name}</strong>
                </>
              ) : (
                "Free-form conversational drafting"
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="ghost-action"
          style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
          title="Configure OpenRouter Model & API Key"
        >
          ⚙️ {customKey ? "API Key Set" : "API Config"}
        </button>
      </div>

      {/* Optional Settings Panel */}
      {showSettings && (
        <div
          style={{
            padding: "0.85rem 1rem",
            borderBottom: "1px solid var(--line)",
            background: "var(--paper)",
            fontSize: "0.78rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <strong style={{ color: "var(--ink)" }}>OpenRouter Configuration</strong>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--ink-soft)" }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: "0 0 0.65rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Enter your OpenRouter API key to power conversational drafting with OpenRouter models (e.g. GPT-4o, Claude 3.5, Gemini, Llama). A smart built-in fallback also operates automatically.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "0.65rem" }}>
            <div>
              <label className="label" style={{ marginTop: 0, marginBottom: "0.25rem" }}>
                OpenRouter API Key
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="field"
                style={{ padding: "0.45rem 0.65rem", fontSize: "0.78rem" }}
              />
            </div>
            <div>
              <label className="label" style={{ marginTop: 0, marginBottom: "0.25rem" }}>
                Model Identifier
              </label>
              <input
                type="text"
                placeholder="openai/gpt-4o-mini"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="field"
                style={{ padding: "0.45rem 0.65rem", fontSize: "0.78rem" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={saveSettings}
              className="primary-action"
              style={{ marginTop: 0, width: "auto", padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div className={`chat-bubble ${msg.role}`}>
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

              {/* Populated fields tag */}
              {msg.fieldUpdates && Object.keys(msg.fieldUpdates).length > 0 && (
                <div
                  style={{
                    marginTop: "0.65rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                    fontSize: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: msg.role === "user" ? "#fff" : "var(--accent)",
                      display: "block",
                      marginBottom: "0.3rem",
                    }}
                  >
                    ⚡ Populated Fields:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {Object.entries(msg.fieldUpdates).map(([k, v]) => (
                      <span key={k} className="field-chip">
                        {k}: <strong>{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Closest template suggestion button */}
              {msg.suggestedTemplateId && (
                <div style={{ marginTop: "0.65rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const t = legalTemplates.find((temp) => temp.id === msg.suggestedTemplateId);
                      if (t) {
                        onSelectTemplate(t);
                        handleSend(`Let's start the ${t.name}.`);
                      }
                    }}
                    className="primary-action"
                    style={{
                      width: "auto",
                      marginTop: "0.25rem",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    Start Closest:{" "}
                    <strong>
                      {legalTemplates.find((temp) => temp.id === msg.suggestedTemplateId)?.name || "Supported Template"}
                    </strong>{" "}
                    →
                  </button>
                </div>
              )}
            </div>

            <span className="chat-bubble-timestamp">
              {msg.role === "user" ? "You" : "Pre-Legal AI"} · {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "999px",
                background: "var(--accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 800,
              }}
            >
              AI
            </div>
            <div className="chat-bubble assistant" style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>
              Pre-Legal AI is reviewing details and updating the document…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick pills */}
      <div className="chat-pills">
        {quickPills.map((pill) => (
          <button
            key={pill}
            type="button"
            disabled={loading}
            onClick={() => handleSend(pill)}
            className="chat-pill"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Chat Input Row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="chat-input-row"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeTemplate
              ? `Answer about ${activeTemplate.name} or type any instructions...`
              : "Describe what contract you need or ask any legal question..."
          }
          disabled={loading}
          className="field"
          style={{ padding: "0.65rem 0.85rem", fontSize: "0.85rem" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="primary-action"
          style={{
            width: "auto",
            marginTop: 0,
            padding: "0.65rem 1.15rem",
            fontSize: "0.85rem",
            opacity: loading || !input.trim() ? 0.6 : 1,
          }}
        >
          Send ↑
        </button>
      </form>
    </div>
  );
}
