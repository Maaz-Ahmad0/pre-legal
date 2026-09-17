"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDocument,
  legalTemplates,
  findClosestTemplate,
  getTemplateById,
  type LegalTemplate,
  type PreLegalDocument,
} from "@/lib/prelegal";
import { supabase } from "@/lib/supabase";
import { DocumentChat } from "@/components/DocumentChat";
import { AccountBubble } from "@/components/AccountBubble";

type User = {
  name: string;
  email: string;
  company: string;
};

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PreLegalSaas() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [documents, setDocuments] = useState<PreLegalDocument[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editorMode, setEditorMode] = useState<"chat" | "form">("chat");

  // OpenRouter key persistence
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState("openai/gpt-4o-mini");

  useEffect(() => {
    const savedKey = window.localStorage.getItem("pre-legal-openrouter-key") || "";
    const savedModel = window.localStorage.getItem("pre-legal-openrouter-model") || "openai/gpt-4o-mini";
    setOpenRouterApiKey(savedKey);
    setOpenRouterModel(savedModel);
  }, []);

  const handleUpdateApiKey = (key: string) => {
    setOpenRouterApiKey(key);
    window.localStorage.setItem("pre-legal-openrouter-key", key);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted || !data.user) {
          // If not authenticated, create a default local document so the app is immediately usable!
          if (documents.length === 0) {
            const defaultDoc = createDocument(legalTemplates[0]);
            setDocuments([defaultDoc]);
            setActiveId(defaultDoc.id);
          }
          return;
        }
        setUser({
          name: String(data.user.user_metadata.name || ""),
          email: data.user.email || "",
          company: String(data.user.user_metadata.company || "Pre-Legal"),
        });
        const result = await supabase
          .from("documents")
          .select("id, template_id, title, status, values, updated_at")
          .order("updated_at", { ascending: false });
        if (result.error) setAuthMessage(result.error.message);
        if (result.data && result.data.length > 0) {
          const parsed = result.data.map((doc) => ({
            id: doc.id,
            templateId: doc.template_id,
            title: doc.title,
            status: doc.status as PreLegalDocument["status"],
            values: (doc.values as Record<string, string>) || {},
            updatedAt: doc.updated_at,
          }));
          setDocuments(parsed);
          setActiveId(parsed[0]?.id ?? "");
        } else {
          // Initialize with default template
          const defaultDoc = createDocument(legalTemplates[0]);
          setDocuments([defaultDoc]);
          setActiveId(defaultDoc.id);
        }
      } catch (e: any) {
        console.warn("Supabase auth check notice:", e?.message);
        if (documents.length === 0) {
          const defaultDoc = createDocument(legalTemplates[0]);
          setDocuments([defaultDoc]);
          setActiveId(defaultDoc.id);
        }
      }
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const activeDocument =
    documents.find((doc) => doc.id === activeId) ?? documents[0];
  const activeTemplate =
    getTemplateById(activeDocument?.templateId || "") ??
    legalTemplates.find((t) => t.id === activeDocument?.templateId) ??
    legalTemplates[0];

  const searchMatch = useMemo(() => {
    if (!query.trim()) return null;
    return findClosestTemplate(query);
  }, [query]);

  const filteredTemplates = useMemo(() => {
    if (!query.trim()) return legalTemplates;
    return legalTemplates.filter((template) =>
      `${template.name} ${template.category} ${template.description} ${(template.aliases || []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [query]);

  const metrics = useMemo(
    () => [
      ["Templates Supported", legalTemplates.length.toString()],
      ["Active Documents", documents.length.toString()],
      ["Ready for Signature", documents.filter((doc) => doc.status === "Ready").length.toString()],
    ],
    [documents]
  );

  const login = async (formData: FormData) => {
    setAuthMessage("");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const profile = {
      name: String(formData.get("name") || "Maaz Ahmad"),
      company: String(formData.get("company") || "Pre-Legal"),
    };
    try {
      const result =
        authMode === "signup"
          ? await supabase.auth.signUp({ email, password, options: { data: profile } })
          : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) return setAuthMessage(result.error.message);
      if (!result.data.session)
        return setAuthMessage("Check your email to confirm your account, then sign in.");
      setUser({
        name: String(result.data.user?.user_metadata.name || profile.name),
        email,
        company: String(result.data.user?.user_metadata.company || profile.company),
      });
    } catch (err: any) {
      setAuthMessage(err?.message || "Authentication error occurred.");
    }
  };

  const startDocument = (template: LegalTemplate) => {
    const next = createDocument(template);
    setDocuments((current) => [next, ...current]);
    setActiveId(next.id);
    void saveDocument(next);
  };

  const saveDocument = async (document: PreLegalDocument) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setSaving(true);
      const result = await supabase.from("documents").upsert({
        id: document.id,
        user_id: data.user.id,
        template_id: document.templateId,
        title: document.title,
        status: document.status,
        values: document.values,
        updated_at: document.updatedAt,
      });
      if (result.error) setAuthMessage(result.error.message);
    } catch (err: any) {
      console.warn("Save document error:", err?.message);
    } finally {
      setSaving(false);
    }
  };

  const updateDocument = (patch: Partial<PreLegalDocument>) => {
    setDocuments((current) => {
      const targetId = activeDocument?.id;
      const nextDocuments = current.map((doc) =>
        doc.id === targetId
          ? { ...doc, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }
          : doc
      );
      const changed = nextDocuments.find((doc) => doc.id === targetId);
      if (changed) void saveDocument(changed);
      return nextDocuments;
    });
  };

  const updateValue = (fieldId: string, value: string) => {
    if (!activeDocument) return;
    updateDocument({ values: { ...activeDocument.values, [fieldId]: value } });
  };

  const handleCopy = () => {
    if (!activeTemplate || !activeDocument) return;
    const text = activeTemplate.render(activeDocument.values);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Auth screen if not logged in
  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-hero">
          <p className="eyebrow">Pre-Legal Legal Ops</p>
          <h1>Free-form AI legal drafting.</h1>
          <p>
            Chat naturally with an intelligent AI that asks about your document, asks about the
            parties and fields, and populates your agreement in real-time with full Common Paper standards.
          </p>
          <div className="auth-stats">
            <span>{legalTemplates.length} Supported Templates</span>
            <span>Free-form AI Chat</span>
            <span>Live Markdown Preview</span>
            <span>OpenRouter Powered</span>
          </div>
        </section>

        <div className="flex flex-col justify-center items-center p-6">
          <form action={login} className="auth-panel w-full max-w-md">
            <div className="segmented">
              <button
                type="button"
                className={authMode === "signup" ? "active" : ""}
                onClick={() => setAuthMode("signup")}
              >
                Sign up
              </button>
              <button
                type="button"
                className={authMode === "signin" ? "active" : ""}
                onClick={() => setAuthMode("signin")}
              >
                Sign in
              </button>
            </div>
            <h2>{authMode === "signup" ? "Create workspace" : "Welcome back"}</h2>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input className="field" id="name" name="name" placeholder="Maaz Ahmad" />
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="field"
              id="email"
              name="email"
              type="email"
              placeholder="maaz@example.com"
              required
            />
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="field"
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
            />
            <label className="label" htmlFor="company">
              Company
            </label>
            <input className="field" id="company" name="company" placeholder="Pre-Legal Inc." />
            <button className="primary-action" type="submit">
              Continue to workspace
            </button>
            {authMessage && (
              <p className="text-sm text-red-600 mt-2" role="alert">
                {authMessage}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-[var(--line)] text-center">
              <button
                type="button"
                onClick={() =>
                  setUser({
                    name: "Legal Guest",
                    email: "guest@pre-legal.internal",
                    company: "Pre-Legal Ops",
                  })
                }
                className="text-xs text-[var(--accent)] hover:underline font-medium"
              >
                Explore workspace as Guest →
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Left Account and Theme Bubble */}
        <AccountBubble user={null} onSignOut={() => setUser(null)} />
      </main>
    );
  }

  return (
    <main className="app-shell relative">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <p className="brand">Pre-Legal</p>
          <p className="workspace-name">{user.company}</p>
        </div>
        <nav>
          <a href="#chat-editor" className="font-semibold text-[var(--accent)]">
            💬 AI Drafting Chat
          </a>
          <a href="#templates">📚 All {legalTemplates.length} Templates</a>
          <a href="#documents">📄 Saved Documents</a>
        </nav>
        <div className="pt-4 border-t border-[var(--line)]">
          <div className="text-xs text-[var(--ink-soft)] mb-2">Workspace User</div>
          <div className="text-xs font-semibold truncate">{user.name || user.email}</div>
        </div>
      </aside>

      {/* Main Workspace */}
      <section className="workspace pb-24">
        <header className="topbar">
          <div>
            <p className="eyebrow">Legal Ops Workspace</p>
            <h1>Pre-Legal Document Automation</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="user-pill">{user.name || user.email}</div>
          </div>
        </header>

        {authMessage && (
          <p className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3" role="alert">
            {authMessage}
          </p>
        )}
        {saving && <p className="text-xs text-[var(--accent)] animate-pulse mb-2">Saving document…</p>}

        {/* Metric Grid */}
        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        {/* AI Drafting & Live Preview Section */}
        <section id="chat-editor" className="panel mb-8">
          <div className="panel-heading mb-4">
            <div>
              <p className="eyebrow">Interactive Legal Creation</p>
              <h2>
                {activeDocument ? activeDocument.title : "Free-form AI Legal Drafting"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode toggle */}
              <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--paper)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode("chat")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    editorMode === "chat"
                      ? "bg-[var(--panel)] text-[var(--ink)] shadow-xs"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  💬 Free-Form AI Chat
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("form")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    editorMode === "form"
                      ? "bg-[var(--panel)] text-[var(--ink)] shadow-xs"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  📝 Manual Fields ({activeTemplate?.fields.length || 0})
                </button>
              </div>

              {activeDocument && (
                <select
                  className="field status-field !py-1.5 text-xs font-semibold"
                  value={activeDocument.status}
                  onChange={(event) =>
                    updateDocument({
                      status: event.target.value as PreLegalDocument["status"],
                    })
                  }
                >
                  <option>Draft</option>
                  <option>Review</option>
                  <option>Ready</option>
                </select>
              )}
            </div>
          </div>

          <div className="document-layout items-stretch gap-4">
            {/* Left Side: Free-form AI Chat or Manual Form Fields */}
            <div className="flex flex-col min-h-[580px] max-h-[720px]">
              {editorMode === "chat" ? (
                <DocumentChat
                  activeDocument={activeDocument}
                  activeTemplate={activeTemplate}
                  onUpdateDocument={updateDocument}
                  onSelectTemplate={startDocument}
                  openRouterApiKey={openRouterApiKey}
                  onUpdateApiKey={handleUpdateApiKey}
                  openRouterModel={openRouterModel}
                />
              ) : (
                /* Manual Form view fallback */
                <div className="flex-1 overflow-y-auto p-4 border border-[var(--line)] rounded-xl bg-[var(--panel)]">
                  <div className="mb-4 pb-3 border-b border-[var(--line)] flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Direct Field Inputs</h3>
                      <p className="text-xs text-[var(--ink-soft)]">
                        Fields populate automatically through the AI chat, or you can edit them directly here.
                      </p>
                    </div>
                  </div>

                  {activeDocument && activeTemplate ? (
                    <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
                      <label className="full">
                        <span className="label">Document title</span>
                        <input
                          className="field"
                          value={activeDocument.title}
                          onChange={(e) => updateDocument({ title: e.target.value })}
                        />
                      </label>
                      {activeTemplate.fields.map((field) => (
                        <label
                          className={field.type === "textarea" ? "full" : ""}
                          key={field.id}
                        >
                          <span className="label">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </span>
                          {field.type === "textarea" ? (
                            <textarea
                              className="field"
                              value={activeDocument.values[field.id] ?? ""}
                              placeholder={field.placeholder}
                              onChange={(e) => updateValue(field.id, e.target.value)}
                            />
                          ) : field.type === "select" ? (
                            <select
                              className="field"
                              value={activeDocument.values[field.id] ?? ""}
                              onChange={(e) => updateValue(field.id, e.target.value)}
                            >
                              {field.options?.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="field"
                              type={field.type}
                              value={activeDocument.values[field.id] ?? ""}
                              placeholder={field.placeholder}
                              onChange={(e) => updateValue(field.id, e.target.value)}
                            />
                          )}
                        </label>
                      ))}
                    </form>
                  ) : (
                    <div className="empty-state">No document selected.</div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Live Generated Markdown Preview */}
            <div className="flex flex-col min-h-[580px] max-h-[720px] rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
                <div>
                  <p className="eyebrow">Live Preview</p>
                  <h3 className="font-semibold text-sm">
                    {activeTemplate ? activeTemplate.name : "Agreement Draft"}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--line)] hover:bg-[var(--paper)] transition"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Markdown"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeDocument || !activeTemplate) return;
                      const slug = activeDocument.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-");
                      downloadMarkdown(`${slug}.md`, activeTemplate.render(activeDocument.values));
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)] transition"
                  >
                    ⬇ Download (.md)
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 font-mono text-xs leading-relaxed text-[var(--ink)]">
                <pre className="whitespace-pre-wrap font-inherit">
                  {activeTemplate && activeDocument
                    ? activeTemplate.render(activeDocument.values)
                    : "Pick or describe a template to generate your document."}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Template Library with Support for All 12 Document Types */}
        <section id="templates" className="panel mb-8">
          <div className="panel-heading mb-4">
            <div>
              <p className="eyebrow">Complete Template Library ({legalTemplates.length} Supported)</p>
              <h2>Every Document We Have Templates For</h2>
            </div>
            <div className="w-full max-w-sm">
              <input
                className="field search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search templates (or try unsupported ones)..."
              />
            </div>
          </div>

          {/* Unsupported Document Checker Alert */}
          {searchMatch && !searchMatch.isSupported && searchMatch.unsupportedInfo && (
            <div className="mb-6 p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-[var(--ink)] text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
                <span>⚠️</span>
                <span>Document Notice: Unsupported Document Type</span>
              </div>
              <p>{searchMatch.unsupportedInfo.explanation}</p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <span className="text-xs text-[var(--ink-soft)] font-medium">
                  {searchMatch.unsupportedInfo.suggestedAction}
                </span>
                {searchMatch.template && (
                  <button
                    type="button"
                    onClick={() => startDocument(searchMatch.template!)}
                    className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-deep)] transition"
                  >
                    Start Closest: {searchMatch.template.name} →
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="template-grid">
            {filteredTemplates.map((template) => (
              <article className="template-card" key={template.id}>
                <span>{template.category}</span>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[var(--line)]">
                  <span className="text-[11px] text-[var(--ink-soft)]">
                    {template.fields.length} key fields
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      startDocument(template);
                      setEditorMode("chat");
                      window.location.hash = "chat-editor";
                    }}
                    className="px-3 py-1.5 text-xs font-semibold"
                  >
                    Draft with AI →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Saved Documents */}
        <section id="documents" className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Saved Documents</p>
              <h2>Recent Work ({documents.length})</h2>
            </div>
          </div>
          <div className="document-list">
            {documents.map((doc) => (
              <button
                className={
                  doc.id === activeDocument?.id ? "document-row selected" : "document-row"
                }
                key={doc.id}
                type="button"
                onClick={() => {
                  setActiveId(doc.id);
                  window.location.hash = "chat-editor";
                }}
              >
                <div>
                  <span className="font-semibold block">{doc.title}</span>
                  <small className="text-xs text-[var(--ink-soft)]">
                    Template: {getTemplateById(doc.templateId)?.name || doc.templateId}
                  </small>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === "Ready"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold"
                        : "bg-neutral-100 dark:bg-neutral-800 text-[var(--ink-soft)]"
                    }`}
                  >
                    {doc.status}
                  </span>
                  <small>Updated {doc.updatedAt}</small>
                </div>
              </button>
            ))}
            {documents.length === 0 && (
              <p className="empty-state">No saved documents yet. Start a template with AI above.</p>
            )}
          </div>
        </section>
      </section>

      {/* Small Account & Theme Bubble Placed in Left Bottom of Screen */}
      <AccountBubble
        user={user}
        onSignOut={() => {
          void supabase.auth.signOut().then(() => setUser(null));
        }}
      />
    </main>
  );
}
