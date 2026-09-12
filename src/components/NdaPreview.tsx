"use client";

import { display, type NdaFormData } from "@/lib/nda";

export function NdaPreview({ data }: { data: NdaFormData }) {
  const mndaTerm =
    data.mndaTermMode === "expires" ? (
      <>
        Expires <span className="filled">{display(data.mndaTermYears, "1")}</span> year(s) from
        Effective Date.
      </>
    ) : (
      <>Continues until terminated in accordance with the terms of the MNDA.</>
    );

  const confidentiality =
    data.confidentialityMode === "years" ? (
      <>
        <span className="filled">{display(data.confidentialityYears, "1")}</span> year(s) from
        Effective Date, but in the case of trade secrets until Confidential Information is no
        longer considered a trade secret under applicable laws.
      </>
    ) : (
      <>In perpetuity.</>
    );

  const p1 = data.party1;
  const p2 = data.party2;

  return (
    <article className="doc-sheet rounded-sm px-6 py-8 sm:px-10 sm:py-12 text-[0.95rem] leading-relaxed text-ink">
      <header className="mb-8 border-b border-[var(--line)] pb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-accent-deep mb-2">Pre-Legal</p>
        <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
          Mutual Non-Disclosure Agreement
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          Cover Page + Common Paper Mutual NDA Standard Terms (Version 1.0)
        </p>
      </header>

      <section className="space-y-5">
        <p>
          This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page
          (“Cover Page”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0
          (“Standard Terms”).
        </p>

        <div>
          <h3 className="font-display text-xl mb-1">Purpose</h3>
          <p className="filled whitespace-pre-wrap">{display(data.purpose)}</p>
        </div>

        <div>
          <h3 className="font-display text-xl mb-1">Effective Date</h3>
          <p className="filled">{display(data.effectiveDate)}</p>
        </div>

        <div>
          <h3 className="font-display text-xl mb-1">MNDA Term</h3>
          <p>{mndaTerm}</p>
        </div>

        <div>
          <h3 className="font-display text-xl mb-1">Term of Confidentiality</h3>
          <p>{confidentiality}</p>
        </div>

        <div>
          <h3 className="font-display text-xl mb-1">Governing Law &amp; Jurisdiction</h3>
          <p>
            Governing Law: <span className="filled">{display(data.governingLaw, "[Fill in state]")}</span>
          </p>
          <p className="mt-1">
            Jurisdiction:{" "}
            <span className="filled">
              {display(data.jurisdiction, "[Fill in city or county and state]")}
            </span>
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl mb-1">MNDA Modifications</h3>
          <p className="filled whitespace-pre-wrap">
            {data.modifications.trim() || "None."}
          </p>
        </div>
      </section>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left">
              <th className="py-2 pr-3 font-semibold"> </th>
              <th className="py-2 pr-3 font-semibold">Party 1</th>
              <th className="py-2 font-semibold">Party 2</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["Signature", p1.signature, p2.signature],
                ["Print Name", p1.printName, p2.printName],
                ["Title", p1.title, p2.title],
                ["Company", p1.company, p2.company],
                ["Notice Address", p1.noticeAddress, p2.noticeAddress],
                ["Date", p1.date, p2.date],
              ] as const
            ).map(([label, a, b]) => (
              <tr key={label} className="border-b border-[var(--line)] align-top">
                <td className="py-2.5 pr-3 text-ink-soft">{label}</td>
                <td className="py-2.5 pr-3">
                  <span className="filled">{display(a)}</span>
                </td>
                <td className="py-2.5">
                  <span className="filled">{display(b)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 space-y-4 border-t border-[var(--line)] pt-8">
        <h3 className="font-display text-2xl">Standard Terms</h3>
        <p>
          The Receiving Party shall use Confidential Information solely for the{" "}
          <span className="filled">{display(data.purpose, "Purpose")}</span>; protect it with at
          least reasonable care; and not disclose it except as allowed by the Standard Terms.
        </p>
        <p>
          This MNDA is governed by the laws of{" "}
          <span className="filled">{display(data.governingLaw, "[Governing Law]")}</span>. Suits
          must be brought in{" "}
          <span className="filled">{display(data.jurisdiction, "[Jurisdiction]")}</span>.
        </p>
        <p className="text-xs text-ink-soft leading-relaxed">
          Full Standard Terms follow Common Paper Mutual NDA Version 1.0 and are included in the
          downloaded file. Licensed under CC BY 4.0.
        </p>
      </section>
    </article>
  );
}
