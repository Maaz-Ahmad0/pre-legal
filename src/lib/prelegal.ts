export type TemplateField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type LegalTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: TemplateField[];
  render: (values: Record<string, string>) => string;
};

export type PreLegalDocument = {
  id: string;
  templateId: string;
  title: string;
  status: "Draft" | "Review" | "Ready";
  updatedAt: string;
  values: Record<string, string>;
};

const val = (values: Record<string, string>, key: string, fallback = "__________") =>
  values[key]?.trim() || fallback;

export const legalTemplates: LegalTemplate[] = [
  {
    id: "mutual-nda",
    name: "Mutual NDA",
    category: "Confidentiality",
    description: "Protect sensitive information before vendor, investor, or partnership talks.",
    fields: [
      { id: "partyA", label: "First party", type: "text", placeholder: "Acme Inc.", required: true },
      { id: "partyB", label: "Second party", type: "text", placeholder: "Northstar LLC", required: true },
      { id: "purpose", label: "Purpose", type: "textarea", placeholder: "Evaluating a commercial relationship", required: true },
      { id: "effectiveDate", label: "Effective date", type: "date", required: true },
      { id: "term", label: "Agreement term", type: "select", options: ["1 year", "2 years", "3 years", "Until terminated"] },
      { id: "law", label: "Governing law", type: "text", placeholder: "Delaware" },
    ],
    render: (v) => `# Mutual Non-Disclosure Agreement

This Mutual Non-Disclosure Agreement is entered into by ${val(v, "partyA")} and ${val(v, "partyB")} as of ${val(v, "effectiveDate")}.

## Purpose
The parties may exchange confidential information solely for: ${val(v, "purpose")}.

## Term
This agreement remains effective for ${val(v, "term", "1 year")}. Confidential information must be protected with reasonable care and used only for the purpose above.

## Governing Law
This agreement is governed by the laws of ${val(v, "law", "[state]")}.

## Signatures

${val(v, "partyA")} ____________________

${val(v, "partyB")} ____________________
`,
  },
  {
    id: "dpa",
    name: "Data Processing Addendum",
    category: "Privacy",
    description: "Define processor obligations, subprocessors, audit rights, and security duties.",
    fields: [
      { id: "controller", label: "Controller", type: "text", required: true },
      { id: "processor", label: "Processor", type: "text", required: true },
      { id: "dataTypes", label: "Personal data categories", type: "textarea", placeholder: "Names, emails, billing data" },
      { id: "processingPurpose", label: "Processing purpose", type: "textarea" },
      { id: "subprocessors", label: "Approved subprocessors", type: "textarea", placeholder: "AWS, Stripe, SendGrid" },
      { id: "noticePeriod", label: "Subprocessor notice period", type: "select", options: ["15 days", "30 days", "45 days"] },
    ],
    render: (v) => `# Data Processing Addendum

This DPA is between ${val(v, "controller")} as Controller and ${val(v, "processor")} as Processor.

## Processing Details
Processor will process personal data for: ${val(v, "processingPurpose")}.

Personal data may include: ${val(v, "dataTypes")}.

## Security and Subprocessors
Processor will maintain appropriate technical and organizational safeguards. Approved subprocessors include: ${val(v, "subprocessors", "None listed")}.

Processor will provide ${val(v, "noticePeriod", "30 days")} notice before adding a new subprocessor.
`,
  },
  {
    id: "msa",
    name: "Master Services Agreement",
    category: "Commercial",
    description: "Set the baseline terms for professional services, payment, IP, and liability.",
    fields: [
      { id: "client", label: "Client", type: "text", required: true },
      { id: "provider", label: "Service provider", type: "text", required: true },
      { id: "services", label: "Services", type: "textarea", required: true },
      { id: "fees", label: "Fees", type: "text", placeholder: "$5,000 per month" },
      { id: "paymentTerms", label: "Payment terms", type: "select", options: ["Due on receipt", "Net 15", "Net 30", "Net 45"] },
      { id: "liabilityCap", label: "Liability cap", type: "text", placeholder: "Fees paid in the prior 12 months" },
    ],
    render: (v) => `# Master Services Agreement

This Master Services Agreement is between ${val(v, "client")} and ${val(v, "provider")}.

## Services
${val(v, "provider")} will provide the following services: ${val(v, "services")}.

## Fees and Payment
Fees: ${val(v, "fees")}. Payment terms: ${val(v, "paymentTerms", "Net 30")}.

## Liability
Except for excluded claims, each party's aggregate liability is capped at ${val(v, "liabilityCap", "fees paid in the prior 12 months")}.
`,
  },
  {
    id: "pilot",
    name: "Pilot Agreement",
    category: "Growth",
    description: "Run a limited product pilot with scope, timeline, success criteria, and fees.",
    fields: [
      { id: "customer", label: "Customer", type: "text", required: true },
      { id: "vendor", label: "Vendor", type: "text", required: true },
      { id: "pilotScope", label: "Pilot scope", type: "textarea", required: true },
      { id: "startDate", label: "Start date", type: "date" },
      { id: "duration", label: "Duration", type: "select", options: ["30 days", "60 days", "90 days"] },
      { id: "successCriteria", label: "Success criteria", type: "textarea" },
    ],
    render: (v) => `# Pilot Agreement

${val(v, "customer")} and ${val(v, "vendor")} agree to run a product pilot beginning ${val(v, "startDate")}.

## Scope
${val(v, "pilotScope")}

## Duration
The pilot will run for ${val(v, "duration", "60 days")}.

## Success Criteria
${val(v, "successCriteria", "The parties will mutually evaluate pilot outcomes in good faith.")}
`,
  },
];

export function createDocument(template: LegalTemplate): PreLegalDocument {
  const today = new Date().toISOString().slice(0, 10);
  const values = Object.fromEntries(
    template.fields.map((field) => [
      field.id,
      field.type === "date" ? today : field.type === "select" ? field.options?.[0] ?? "" : "",
    ]),
  );

  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    title: `${template.name} draft`,
    status: "Draft",
    updatedAt: today,
    values,
  };
}
