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
    <div className="flex flex-col h-full bg-[var(--panel)] border border-[var(--line)] rounded-xl shadow-[var(--shadow)] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--ink)]">Pre-Legal Legal Assistant</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                OpenRouter
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)]">
              {activeTemplate ? (
                <>
                  Drafting: <strong className="text-[var(--ink)]">{activeTemplate.name}</strong>
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
          className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] px-2.5 py-1.5 rounded border border-[var(--line)] hover:bg-[var(--panel)] transition flex items-center gap-1.5"
          title="Configure OpenRouter Model & API Key"
        >
          <span>⚙️</span>
          <span>{customKey ? "API Key Set" : "Config"}</span>
        </button>
      </div>

      {/* Optional Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-[var(--line)] bg-neutral-50 dark:bg-neutral-900/60 text-xs space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <strong className="text-[var(--ink)] font-semibold">OpenRouter Configuration</strong>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              ✕
            </button>
          </div>
          <p className="text-[var(--ink-soft)] leading-relaxed">
            Enter your OpenRouter API key to power conversational drafting with OpenRouter models (e.g. GPT-4o, Claude 3.5, Gemini, Llama). A smart built-in fallback also operates automatically.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[var(--ink-soft)] font-medium mb-1">
                OpenRouter API Key
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[var(--ink-soft)] font-medium mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                placeholder="openai/gpt-4o-mini"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={saveSettings}
              className="px-3 py-1 bg-[var(--accent)] text-white rounded text-xs font-semibold hover:bg-[var(--accent-deep)] transition"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-xs shadow-sm"
                  : "bg-[var(--paper)] text-[var(--ink)] border border-[var(--line)] rounded-bl-xs shadow-xs"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Show populated fields badge if any */}
              {msg.fieldUpdates && Object.keys(msg.fieldUpdates).length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[var(--line)]/60 text-xs">
                  <span className="font-semibold text-[var(--accent)] flex items-center gap-1 mb-1">
                    <span>⚡ Populated Fields:</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(msg.fieldUpdates).map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--ink)] font-mono text-[11px]"
                      >
                        {k}: <strong>{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show suggested template action button if unsupported detected */}
              {msg.suggestedTemplateId && (
                <div className="mt-3 pt-2.5 border-t border-[var(--line)]/60">
                  <button
                    type="button"
                    onClick={() => {
                      const t = legalTemplates.find((temp) => temp.id === msg.suggestedTemplateId);
                      if (t) {
                        onSelectTemplate(t);
                        handleSend(`Let's start the ${t.name}.`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-deep)] shadow-sm transition"
                  >
                    <span>Use Closest Template:</span>
                    <strong>
                      {legalTemplates.find((temp) => temp.id === msg.suggestedTemplateId)?.name ||
                        "Supported Template"}
                    </strong>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] text-[var(--ink-soft)] px-2 mt-1">
              {msg.role === "user" ? "You" : "Pre-Legal AI"} · {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[11px] font-bold">
              AI
            </div>
            <div className="bg-[var(--paper)] text-[var(--ink-soft)] border border-[var(--line)] rounded-2xl rounded-bl-xs px-4 py-3 text-sm flex items-center gap-2">
              <span className="inline-block animate-pulse">Pre-Legal is thinking…</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts pills */}
      <div className="px-4 py-2 border-t border-[var(--line)]/50 bg-[var(--paper)]/50 flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPills.map((pill) => (
          <button
            key={pill}
            type="button"
            disabled={loading}
            onClick={() => handleSend(pill)}
            className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition whitespace-nowrap cursor-pointer"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-[var(--line)] bg-[var(--panel)] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeTemplate
              ? `Answer about ${activeTemplate.name} fields or instruct the AI...`
              : "Describe the agreement you need or ask for any document..."
          }
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-deep)] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
        >
          <span>Send</span>
          <span>↑</span>
        </button>
      </form>
    </div>
  );
}
