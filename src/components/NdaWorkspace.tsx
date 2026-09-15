"use client";

import { useState } from "react";
import { NdaForm } from "@/components/NdaForm";
import { NdaPreview } from "@/components/NdaPreview";
import { buildFilledNdaMarkdown, downloadMarkdown } from "@/lib/fill-nda";
import { defaultNdaForm, type NdaFormData } from "@/lib/nda";

export function NdaWorkspace() {
  const [data, setData] = useState<NdaFormData>(() => defaultNdaForm());

  const onDownload = () => {
    const markdown = buildFilledNdaMarkdown(data);
    const slug =
      [data.party1.company, data.party2.company]
        .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"))
        .filter(Boolean)
        .join("-and-") || "parties";
    downloadMarkdown(`mutual-nda-${slug}.md`, markdown);
  };

  return (
    <section id="create" className="relative px-5 sm:px-8 lg:px-12 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
            Create your Mutual NDA
          </h2>
          <p className="mt-3 text-ink-soft leading-relaxed">
            Enter the parties and key terms. Watch the agreement fill in, then download the
            completed document to your device.
          </p>
        </div>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-12">
          <div className="rounded-2xl border border-[var(--line)] bg-white/55 backdrop-blur-sm p-5 sm:p-7 shadow-[var(--shadow)]">
            <NdaForm value={data} onChange={setData} />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Download completed NDA
              </button>
              <p className="text-xs text-ink-soft max-w-xs">
                Saves a Markdown file locally with your filled cover page and full standard terms.
              </p>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-accent-deep font-semibold">
                Live preview
              </p>
            </div>
            <NdaPreview data={data} />
          </div>
        </div>
      </div>
    </section>
  );
}
