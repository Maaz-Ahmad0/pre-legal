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

        <form action={login} className="auth-panel">
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

          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)", textAlign: "center" }}>
            <button
              type="button"
              onClick={() =>
                setUser({
                  name: "Legal Guest",
                  email: "guest@pre-legal.internal",
                  company: "Pre-Legal Ops",
                })
              }
              style={{
                background: "transparent",
                border: 0,
                color: "var(--accent)",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Explore workspace as Guest →
            </button>
          </div>
        </form>

        {/* Bottom Left Account and Theme Bubble */}
        <AccountBubble user={null} onSignOut={() => setUser(null)} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <p className="brand">Pre-Legal</p>
          <p className="workspace-name">{user.company}</p>
        </div>
        <nav>
          <a href="#editor">Editor</a>
          <a href="#templates">Templates</a>
          <a href="#documents">Documents</a>
        </nav>
        <button
          className="ghost-action"
          type="button"
          onClick={() => {
            void supabase.auth.signOut().then(() => setUser(null));
          }}
        >
          Sign out
        </button>
      </aside>

      {/* Main Workspace */}
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Legal Ops Workspace</p>
            <h1>Pre-Legal Document Automation</h1>
          </div>
          <div className="user-pill">{user.name || user.email}</div>
        </header>

        {authMessage && (
          <p className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3" role="alert">
            {authMessage}
          </p>
        )}
        {saving && <p className="text-xs text-ink-soft mb-2">Saving document…</p>}

        {/* Metric Grid */}
        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        {/* Template Library with Support for All 12 Document Types */}
        <section id="templates" className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Template Library ({legalTemplates.length} Supported)</p>
              <h2>Every Document We Have Templates For</h2>
            </div>
            <input
              className="field search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates (or try unsupported ones)..."
            />
          </div>

          {/* Unsupported Document Checker Notice */}
          {searchMatch && !searchMatch.isSupported && searchMatch.unsupportedInfo && (
            <div
              style={{
                marginBottom: "1.25rem",
                padding: "1rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #f59e0b",
                background: "rgba(245, 158, 11, 0.08)",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ fontWeight: 800, color: "#b45309", marginBottom: "0.35rem" }}>
                ⚠️ Notice: Unsupported Document Type
              </div>
              <p style={{ margin: "0 0 0.5rem", color: "var(--ink)" }}>
                {searchMatch.unsupportedInfo.explanation}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>
                  {searchMatch.unsupportedInfo.suggestedAction}
                </span>
                {searchMatch.template && (
                  <button
                    type="button"
                    onClick={() => {
                      startDocument(searchMatch.template!);
                      window.location.hash = "editor";
                    }}
                    className="primary-action"
                    style={{ width: "auto", marginTop: 0, padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
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
                <button
                  type="button"
                  onClick={() => {
                    startDocument(template);
                    setEditorMode("chat");
                    window.location.hash = "editor";
                  }}
                >
                  Draft with AI →
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Document Editor & Live Preview Section */}
        <section className="document-layout" id="editor">
          {/* Left: Free-form AI Chat or Manual Form */}
          <div className="panel editor-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Document Editor</p>
                <h2>{activeDocument ? activeDocument.title : "Choose a template"}</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {/* Switch between Free-form Chat and Direct Form */}
                <div className="segmented" style={{ margin: 0, padding: "0.2rem" }}>
                  <button
                    type="button"
                    className={editorMode === "chat" ? "active" : ""}
                    onClick={() => setEditorMode("chat")}
                    style={{ padding: "0.4rem 0.65rem", fontSize: "0.75rem" }}
                  >
                    💬 AI Chat
                  </button>
                  <button
                    type="button"
                    className={editorMode === "form" ? "active" : ""}
                    onClick={() => setEditorMode("form")}
                    style={{ padding: "0.4rem 0.65rem", fontSize: "0.75rem" }}
                  >
                    📝 Form
                  </button>
                </div>

                {activeDocument && (
                  <select
                    className="field status-field"
                    style={{ padding: "0.45rem", fontSize: "0.78rem" }}
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
            ) : activeDocument && activeTemplate ? (
              <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
                <label className="full">
                  <span className="label">Document title</span>
                  <input
                    className="field"
                    value={activeDocument.title}
                    onChange={(event) => updateDocument({ title: event.target.value })}
                  />
                </label>
                {activeTemplate.fields.map((field) => (
                  <label className={field.type === "textarea" ? "full" : ""} key={field.id}>
                    <span className="label">
                      {field.label} {field.required && "*"}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        className="field"
                        value={activeDocument.values[field.id] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(event) => updateValue(field.id, event.target.value)}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="field"
                        value={activeDocument.values[field.id] ?? ""}
                        onChange={(event) => updateValue(field.id, event.target.value)}
                      >
                        {field.options?.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="field"
                        type={field.type}
                        value={activeDocument.values[field.id] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(event) => updateValue(field.id, event.target.value)}
                      />
                    )}
                  </label>
                ))}
              </form>
            ) : (
              <div className="empty-state">Pick a template to create your first document.</div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="panel preview-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Live Preview</p>
                <h2>Generated draft</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="ghost-action"
                  onClick={handleCopy}
                  style={{ padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                >
                  {copied ? "✓ Copied" : "Copy Markdown"}
                </button>
                <button
                  type="button"
                  className="primary-action"
                  style={{ width: "auto", marginTop: 0, padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                  onClick={() => {
                    if (!activeDocument || !activeTemplate) return;
                    const slug = activeDocument.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-");
                    downloadMarkdown(`${slug}.md`, activeTemplate.render(activeDocument.values));
                  }}
                >
                  Download (.md)
                </button>
              </div>
            </div>
            <pre>
              {activeTemplate && activeDocument
                ? activeTemplate.render(activeDocument.values)
                : "No document selected."}
            </pre>
          </div>
        </section>

        {/* Saved Documents */}
        <section id="documents" className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Saved documents</p>
              <h2>Recent work</h2>
            </div>
          </div>
          <div className="document-list">
            {documents.map((doc) => (
              <button
                className={doc.id === activeDocument?.id ? "document-row selected" : "document-row"}
                key={doc.id}
                type="button"
                onClick={() => {
                  setActiveId(doc.id);
                  window.location.hash = "editor";
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, display: "block" }}>{doc.title}</span>
                  <small>Template: {getTemplateById(doc.templateId)?.name || doc.templateId}</small>
                </div>
                <small>
                  {doc.status} · Updated {doc.updatedAt}
                </small>
              </button>
            ))}
            {documents.length === 0 && <p className="empty-state">No saved documents yet.</p>}
          </div>
        </section>
      </section>

      {/* Small Account and Theme Bubble Placed in Left Bottom of Screen */}
      <AccountBubble
        user={user}
        onSignOut={() => {
          void supabase.auth.signOut().then(() => setUser(null));
        }}
      />
    </main>
  );
}
