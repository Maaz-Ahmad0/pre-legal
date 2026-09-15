"use client";

import type { NdaFormData, PartyInfo } from "@/lib/nda";

type Props = {
  value: NdaFormData;
  onChange: (next: NdaFormData) => void;
};

function PartyFields({
  label,
  party,
  onChange,
}: {
  label: string;
  party: PartyInfo;
  onChange: (next: PartyInfo) => void;
}) {
  const set = (key: keyof PartyInfo, v: string) => onChange({ ...party, [key]: v });

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-lg text-ink mb-2">{label}</legend>
      <div>
        <label className="label" htmlFor={`${label}-company`}>
          Company
        </label>
        <input
          id={`${label}-company`}
          className="field"
          value={party.company}
          onChange={(e) => set("company", e.target.value)}
          placeholder="Acme Inc."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${label}-name`}>
            Print name
          </label>
          <input
            id={`${label}-name`}
            className="field"
            value={party.printName}
            onChange={(e) => set("printName", e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
        <div>
          <label className="label" htmlFor={`${label}-title`}>
            Title
          </label>
          <input
            id={`${label}-title`}
            className="field"
            value={party.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="CEO"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`${label}-notice`}>
          Notice address (email or postal)
        </label>
        <input
          id={`${label}-notice`}
          className="field"
          value={party.noticeAddress}
          onChange={(e) => set("noticeAddress", e.target.value)}
          placeholder="legal@acme.com"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${label}-signature`}>
            Signature (typed)
          </label>
          <input
            id={`${label}-signature`}
            className="field"
            value={party.signature}
            onChange={(e) => set("signature", e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
        <div>
          <label className="label" htmlFor={`${label}-date`}>
            Date
          </label>
          <input
            id={`${label}-date`}
            type="date"
            className="field"
            value={party.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function NdaForm({ value, onChange }: Props) {
  const patch = (partial: Partial<NdaFormData>) => onChange({ ...value, ...partial });

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Mutual NDA details"
    >
      <div className="space-y-3">
        <h2 className="font-display text-2xl text-ink">Agreement details</h2>
        <p className="text-sm text-ink-soft/90 leading-relaxed">
          Fill in the cover-page terms. The preview updates as you type.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="purpose">
          Purpose
        </label>
        <textarea
          id="purpose"
          className="field min-h-24"
          value={value.purpose}
          onChange={(e) => patch({ purpose: e.target.value })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="effectiveDate">
            Effective date
          </label>
          <input
            id="effectiveDate"
            type="date"
            className="field"
            value={value.effectiveDate}
            onChange={(e) => patch({ effectiveDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="governingLaw">
            Governing law (state)
          </label>
          <input
            id="governingLaw"
            className="field"
            value={value.governingLaw}
            onChange={(e) => patch({ governingLaw: e.target.value })}
            placeholder="Delaware"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="jurisdiction">
          Jurisdiction
        </label>
        <input
          id="jurisdiction"
          className="field"
          value={value.jurisdiction}
          onChange={(e) => patch({ jurisdiction: e.target.value })}
          placeholder='courts located in New Castle, DE'
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="label">MNDA term</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mndaTermMode"
              checked={value.mndaTermMode === "expires"}
              onChange={() => patch({ mndaTermMode: "expires" })}
            />
            Expires after
            <input
              className="field !w-16 !py-1 !px-2"
              type="number"
              min={1}
              value={value.mndaTermYears}
              disabled={value.mndaTermMode !== "expires"}
              onChange={(e) => patch({ mndaTermYears: e.target.value })}
            />
            year(s)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mndaTermMode"
              checked={value.mndaTermMode === "continues"}
              onChange={() => patch({ mndaTermMode: "continues" })}
            />
            Continues until terminated
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="label">Term of confidentiality</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentialityMode"
              checked={value.confidentialityMode === "years"}
              onChange={() => patch({ confidentialityMode: "years" })}
            />
            Protect for
            <input
              className="field !w-16 !py-1 !px-2"
              type="number"
              min={1}
              value={value.confidentialityYears}
              disabled={value.confidentialityMode !== "years"}
              onChange={(e) => patch({ confidentialityYears: e.target.value })}
            />
            year(s)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentialityMode"
              checked={value.confidentialityMode === "perpetuity"}
              onChange={() => patch({ confidentialityMode: "perpetuity" })}
            />
            In perpetuity
          </label>
        </fieldset>
      </div>

      <div>
        <label className="label" htmlFor="modifications">
          Modifications (optional)
        </label>
        <textarea
          id="modifications"
          className="field min-h-20"
          value={value.modifications}
          onChange={(e) => patch({ modifications: e.target.value })}
          placeholder="None"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <PartyFields
          label="Party 1"
          party={value.party1}
          onChange={(party1) => patch({ party1 })}
        />
        <PartyFields
          label="Party 2"
          party={value.party2}
          onChange={(party2) => patch({ party2 })}
        />
      </div>
    </form>
  );
}
