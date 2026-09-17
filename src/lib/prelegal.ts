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
  file?: string;
  aliases?: string[];
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
    name: "Mutual Non-Disclosure Agreement",
    category: "Confidentiality",
    description: "Mutual NDA standard terms allowing both parties to exchange confidential information for an agreed purpose.",
    file: "templates/Mutual-NDA.md",
    aliases: ["nda", "mnda"],
    fields: [
      { id: "partyA", label: "First Party (Company)", type: "text", placeholder: "Acme Inc.", required: true },
      { id: "partyB", label: "Second Party (Company)", type: "text", placeholder: "Northstar LLC", required: true },
      { id: "purpose", label: "Purpose of Disclosure", type: "textarea", placeholder: "Evaluating a commercial relationship or potential transaction", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "term", label: "MNDA Term", type: "select", options: ["1 year", "2 years", "3 years", "Continues until terminated"] },
      { id: "confidentialityTerm", label: "Term of Confidentiality", type: "select", options: ["1 year from Effective Date", "2 years from Effective Date", "3 years from Effective Date", "In perpetuity"] },
      { id: "law", label: "Governing Law (State)", type: "text", placeholder: "Delaware" },
      { id: "jurisdiction", label: "Jurisdiction / Venue", type: "text", placeholder: "Courts located in New Castle County, DE" },
      { id: "modifications", label: "Modifications (Optional)", type: "textarea", placeholder: "None." },
    ],
    render: (v) => `# Mutual Non-Disclosure Agreement

## Cover Page

This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“Cover Page”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 (“Standard Terms”) identical to those posted at https://commonpaper.com/standards/mutual-nda/1.0.

### Purpose
${val(v, "purpose")}

### Effective Date
${val(v, "effectiveDate")}

### MNDA Term
${val(v, "term", "1 year from Effective Date")}

### Term of Confidentiality
${val(v, "confidentialityTerm", "1 year from Effective Date, or until no longer trade secret under applicable law")}

### Governing Law & Jurisdiction
Governing Law: ${val(v, "law", "Delaware")}
Jurisdiction: ${val(v, "jurisdiction", "Courts of competent jurisdiction in Delaware")}

### MNDA Modifications
${val(v, "modifications", "None.")}

---

### Signatures

By signing below, each party agrees to enter into this MNDA as of the Effective Date.

| Party 1 (${val(v, "partyA")}) | Party 2 (${val(v, "partyB")}) |
|:---|:---|
| Signature: ____________________ | Signature: ____________________ |
| Date: ${val(v, "effectiveDate")} | Date: ${val(v, "effectiveDate")} |

---

# Standard Terms (Common Paper CC BY 4.0)

1. **Introduction**. This Mutual Non-Disclosure Agreement allows each party (“Disclosing Party”) to disclose Confidential Information to the other party (“Receiving Party”) in connection with the Purpose.
2. **Use and Protection**. Receiving Party will use Confidential Information solely for the Purpose, protect it with at least reasonable care, and not disclose it to third parties without prior written consent.
3. **Exceptions**. Confidential Information does not include information that is publicly known, already known without obligation, rightfully received from a third party, or independently developed.
4. **Governing Law**. Governed by the laws of ${val(v, "law", "Delaware")}, and suits must be brought in ${val(v, "jurisdiction", "the agreed jurisdiction")}.
`,
  },
  {
    id: "mutual-nda-coverpage",
    name: "Mutual NDA Cover Page",
    category: "Confidentiality",
    description: "Structured cover page variables and signature execution blocks for a Common Paper Mutual NDA.",
    file: "templates/Mutual-NDA-coverpage.md",
    fields: [
      { id: "party1Company", label: "Party 1 Company", type: "text", placeholder: "Acme Corp.", required: true },
      { id: "party1Signer", label: "Party 1 Signer Name", type: "text", placeholder: "Alex Rivera" },
      { id: "party1Title", label: "Party 1 Signer Title", type: "text", placeholder: "CEO" },
      { id: "party1Address", label: "Party 1 Notice Address", type: "text", placeholder: "legal@acme.com" },
      { id: "party2Company", label: "Party 2 Company", type: "text", placeholder: "Beta Partners LLC", required: true },
      { id: "party2Signer", label: "Party 2 Signer Name", type: "text", placeholder: "Jordan Lee" },
      { id: "party2Title", label: "Party 2 Signer Title", type: "text", placeholder: "Managing Partner" },
      { id: "party2Address", label: "Party 2 Notice Address", type: "text", placeholder: "notices@betapartners.com" },
      { id: "purpose", label: "Purpose", type: "textarea", placeholder: "Evaluating potential commercial partnership" },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
      { id: "jurisdiction", label: "Jurisdiction", type: "text", placeholder: "New Castle, DE" },
    ],
    render: (v) => `# Mutual Non-Disclosure Agreement Cover Page

### Purpose
${val(v, "purpose")}

### Effective Date
${val(v, "effectiveDate")}

### Governing Law & Jurisdiction
Governing Law: ${val(v, "governingLaw", "Delaware")}
Jurisdiction: ${val(v, "jurisdiction", "Courts in Delaware")}

### Execution Block

| Field | Party 1 | Party 2 |
|:---|:---|:---|
| Company | ${val(v, "party1Company")} | ${val(v, "party2Company")} |
| Signer Name | ${val(v, "party1Signer")} | ${val(v, "party2Signer")} |
| Title | ${val(v, "party1Title")} | ${val(v, "party2Title")} |
| Notice Address | ${val(v, "party1Address")} | ${val(v, "party2Address")} |
| Date | ${val(v, "effectiveDate")} | ${val(v, "effectiveDate")} |
| Signature | __________________________ | __________________________ |
`,
  },
  {
    id: "cloud-service-agreement",
    name: "Cloud Service Agreement",
    category: "Commercial",
    description: "Standard terms for SaaS vendors and cloud software customer subscriptions.",
    file: "templates/CSA.md",
    aliases: ["csa", "saas-agreement", "software-as-a-service"],
    fields: [
      { id: "provider", label: "Cloud Provider (Vendor)", type: "text", placeholder: "CloudSaaS Inc.", required: true },
      { id: "customer", label: "Customer", type: "text", placeholder: "Enterprise Client Corp", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "subscriptionPeriod", label: "Subscription Period", type: "select", options: ["12 months", "24 months", "36 months", "Month-to-month"] },
      { id: "technicalSupport", label: "Technical Support", type: "select", options: ["Standard (Email, 24-48h response)", "Priority (24/7 Slack & Phone, 2h response)", "Enterprise Dedicated TAM"] },
      { id: "paymentTerms", label: "Payment Terms", type: "select", options: ["Net 30", "Net 15", "Due on receipt", "Annual upfront"] },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
      { id: "useLimitations", label: "Use Limitations / Seat Count", type: "text", placeholder: "Up to 50 active users or API tier limits" },
    ],
    render: (v) => `# Cloud Service Agreement

This Cloud Service Agreement is entered into between ${val(v, "provider")} (“Provider”) and ${val(v, "customer")} (“Customer”) as of ${val(v, "effectiveDate")}.

## 1. Cloud Service & Access
Customer may access and use Provider’s Cloud Service during the Subscription Period (${val(v, "subscriptionPeriod", "12 months")}) subject to the Use Limitations: ${val(v, "useLimitations", "Standard authorized user accounts")}.

## 2. Support & Maintenance
Provider will provide Technical Support: ${val(v, "technicalSupport", "Standard support channels")}.

## 3. Payment & Invoicing
Payment terms: ${val(v, "paymentTerms", "Net 30")}. All fees are non-refundable except as expressly provided.

## 4. Governing Law
This Agreement is governed by the laws of ${val(v, "governingLaw", "Delaware")}.

## 5. Signatures
Provider: ${val(v, "provider")} ____________________
Customer: ${val(v, "customer")} ____________________
`,
  },
  {
    id: "service-level-agreement",
    name: "Service Level Agreement",
    category: "Commercial",
    description: "Uptime commitments, target response times, and service credit remedies for hosted services.",
    file: "templates/sla.md",
    aliases: ["sla"],
    fields: [
      { id: "provider", label: "Service Provider", type: "text", placeholder: "CloudHost Ltd.", required: true },
      { id: "customer", label: "Customer", type: "text", placeholder: "Client Systems Corp", required: true },
      { id: "targetUptime", label: "Target Uptime (%)", type: "select", options: ["99.9% (Three Nines)", "99.95%", "99.99% (Four Nines)", "99.5%"] },
      { id: "targetResponseTime", label: "Target Response Time", type: "select", options: ["Under 1 hour (Critical)", "Under 4 hours", "Under 24 hours", "Same business day"] },
      { id: "supportChannel", label: "Support Channel", type: "text", placeholder: "support@provider.com or in-app ticketing" },
      { id: "maxCredit", label: "Max Monthly Service Credit", type: "select", options: ["10% of monthly fee", "20% of monthly fee", "30% of monthly fee"] },
      { id: "effectiveDate", label: "Effective Date", type: "date" },
    ],
    render: (v) => `# Service Level Agreement (SLA)

Between ${val(v, "provider")} (“Provider”) and ${val(v, "customer")} (“Customer”), effective ${val(v, "effectiveDate")}.

## 1. Uptime Commitment
- **Target Uptime**: ${val(v, "targetUptime", "99.9%")} per calendar month.
- Uptime is calculated as (Available Minutes - Downtime Minutes) / Available Minutes.

## 2. Response Time & Channels
- **Target Response Time**: ${val(v, "targetResponseTime", "Under 1 hour")}.
- **Designated Support Channel**: ${val(v, "supportChannel", "Ticketing system and emergency support portal")}.

## 3. Service Credits
If uptime falls below Target Uptime, Customer is eligible for service credits up to a maximum cap of ${val(v, "maxCredit", "20% of monthly fee")}.
`,
  },
  {
    id: "data-processing-agreement",
    name: "Data Processing Agreement",
    category: "Privacy",
    description: "Standard DPA terms governing personal data processing under GDPR, CCPA, and privacy laws.",
    file: "templates/DPA.md",
    aliases: ["dpa", "data-processing-addendum"],
    fields: [
      { id: "controller", label: "Data Controller (Customer)", type: "text", placeholder: "Customer Inc.", required: true },
      { id: "processor", label: "Data Processor (Vendor)", type: "text", placeholder: "Processor SaaS LLC", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "processingPurpose", label: "Processing Purpose", type: "textarea", placeholder: "Provisioning SaaS services, account management, and customer support", required: true },
      { id: "dataTypes", label: "Categories of Personal Data", type: "textarea", placeholder: "Names, emails, IP addresses, transaction records" },
      { id: "subprocessors", label: "Approved Subprocessors", type: "textarea", placeholder: "AWS (Hosting), Stripe (Payments), Postmark (Email)" },
      { id: "noticePeriod", label: "Subprocessor Change Notice Period", type: "select", options: ["15 days", "30 days", "45 days"] },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Ireland (GDPR) / Delaware (US)" },
    ],
    render: (v) => `# Data Processing Agreement (DPA)

This Data Processing Agreement is entered into by ${val(v, "controller")} (“Controller”) and ${val(v, "processor")} (“Processor”) as of ${val(v, "effectiveDate")}.

## 1. Subject Matter and Purpose
Processor processes Personal Data solely on documented instructions from Controller for: ${val(v, "processingPurpose")}.

## 2. Categories of Data
Data Categories: ${val(v, "dataTypes", "Contact and operational personal data")}.

## 3. Security & Subprocessors
- Processor will implement technical and organizational security measures.
- Approved Subprocessors: ${val(v, "subprocessors", "As listed in Provider infrastructure documentation")}.
- Notice period for subprocessor additions: ${val(v, "noticePeriod", "30 days")}.

## 4. Governing Law
Governed by the laws of ${val(v, "governingLaw", "Ireland for GDPR compliance / Delaware")}.
`,
  },
  {
    id: "design-partner-agreement",
    name: "Design Partner Agreement",
    category: "Commercial",
    description: "Collaboration agreement for early design partners to test early-stage products and provide product feedback.",
    file: "templates/design-partner-agreement.md",
    aliases: ["design-partner", "beta-partner"],
    fields: [
      { id: "company", label: "Company / Developer", type: "text", placeholder: "Alpha Labs Inc.", required: true },
      { id: "partner", label: "Design Partner", type: "text", placeholder: "Beta Innovators LLC", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "programScope", label: "Program Scope & Product", type: "textarea", placeholder: "Early access to AI analytics module for beta testing and feature input" },
      { id: "feedbackRights", label: "Feedback Rights", type: "select", options: ["Company owns feedback with unrestricted royalty-free license", "Sole ownership by Company", "Non-exclusive mutual feedback use"] },
      { id: "trialPeriod", label: "Program Duration", type: "select", options: ["3 months", "6 months", "12 months"] },
      { id: "fees", label: "Program Fees", type: "text", placeholder: "Free of charge during design partner period" },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
    ],
    render: (v) => `# Design Partner Agreement

Entered into between ${val(v, "company")} (“Company”) and ${val(v, "partner")} (“Partner”) on ${val(v, "effectiveDate")}.

## 1. Program Scope
Partner receives early non-exclusive access to: ${val(v, "programScope")}.

## 2. Feedback & Intellectual Property
${val(v, "company")} retains all right, title, and interest in the Product. Feedback terms: ${val(v, "feedbackRights", "Company owns all feedback royalty-free")}.

## 3. Duration & Fees
- **Program Duration**: ${val(v, "trialPeriod", "6 months")}.
- **Program Fees**: ${val(v, "fees", "No fee during design partner evaluation")}.

## 4. Governing Law
Laws of ${val(v, "governingLaw", "Delaware")}.
`,
  },
  {
    id: "professional-services-agreement",
    name: "Professional Services Agreement",
    category: "Commercial",
    description: "Standard terms for consulting, engineering, implementation, or statement-of-work delivery work.",
    file: "templates/psa.md",
    aliases: ["psa", "msa", "consulting-agreement", "services-agreement"],
    fields: [
      { id: "client", label: "Client Name", type: "text", placeholder: "Client Corp", required: true },
      { id: "provider", label: "Service Provider (Consultant/Agency)", type: "text", placeholder: "Apex Consulting LLC", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "services", label: "Description of Services", type: "textarea", placeholder: "Architecture review, custom software development, and technical deployment", required: true },
      { id: "fees", label: "Fees / Rates", type: "text", placeholder: "$150/hour or $10,000 monthly retainer", required: true },
      { id: "paymentTerms", label: "Payment Terms", type: "select", options: ["Net 30", "Net 15", "Due on receipt", "50% upfront, 50% on completion"] },
      { id: "liabilityCap", label: "Liability Cap", type: "text", placeholder: "Total fees paid under the applicable SOW in prior 12 months" },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "New York" },
    ],
    render: (v) => `# Professional Services Agreement

This Agreement is made between ${val(v, "client")} (“Client”) and ${val(v, "provider")} (“Provider”) effective ${val(v, "effectiveDate")}.

## 1. Services & Deliverables
Provider will perform: ${val(v, "services")}.

## 2. Fees & Payment
- **Fees**: ${val(v, "fees")}.
- **Payment Terms**: ${val(v, "paymentTerms", "Net 30")}.

## 3. Liability
Each party’s aggregate liability is capped at: ${val(v, "liabilityCap", "fees paid in prior 12 months")}.

## 4. Governing Law
Laws of ${val(v, "governingLaw", "New York")}.
`,
  },
  {
    id: "partnership-agreement",
    name: "Partnership Agreement",
    category: "Commercial",
    description: "Framework for co-marketing, reseller, referral, and joint commercial partnership initiatives.",
    file: "templates/Partnership-Agreement.md",
    aliases: ["partnership", "channel-partner"],
    fields: [
      { id: "partyA", label: "Partner A (Company)", type: "text", placeholder: "Acme Corp", required: true },
      { id: "partyB", label: "Partner B (Company)", type: "text", placeholder: "Zenith Solutions Inc", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "partnershipType", label: "Partnership Type", type: "select", options: ["Referral & Lead Sharing", "Co-Marketing & Co-Selling", "Reseller / Distribution", "Technology Integration"] },
      { id: "revenueShare", label: "Revenue Share / Commission", type: "text", placeholder: "20% commission on referred closed deals for 12 months" },
      { id: "term", label: "Term", type: "select", options: ["1 year with auto-renewal", "2 years", "Until terminated on 30 days notice"] },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
    ],
    render: (v) => `# Partnership Agreement

Between ${val(v, "partyA")} and ${val(v, "partyB")}, effective ${val(v, "effectiveDate")}.

## 1. Scope & Objective
The parties agree to collaborate on: ${val(v, "partnershipType", "Strategic commercial partnership")}.

## 2. Economics & Revenue Share
${val(v, "revenueShare", "Mutual non-commission collaboration unless set forth in written exhibit")}.

## 3. Term & Termination
Term: ${val(v, "term", "1 year auto-renewing")}. Either party may terminate with 30 days written notice.

## 4. Governing Law
Governed by the laws of ${val(v, "governingLaw", "Delaware")}.
`,
  },
  {
    id: "business-associate-agreement",
    name: "Business Associate Agreement",
    category: "Privacy",
    description: "HIPAA-compliant agreement for managing protected health information (PHI).",
    file: "templates/BAA.md",
    aliases: ["baa", "hipaa-baa"],
    fields: [
      { id: "coveredEntity", label: "Covered Entity", type: "text", placeholder: "HealthCare Systems Inc.", required: true },
      { id: "businessAssociate", label: "Business Associate", type: "text", placeholder: "MedTech Cloud Solutions LLC", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "permittedUses", label: "Permitted Uses of PHI", type: "textarea", placeholder: "Providing cloud-hosted electronic health record indexing and HIPAA-compliant backup services" },
      { id: "breachNoticeHours", label: "Breach Notification Window", type: "select", options: ["24 hours", "48 hours", "72 hours", "5 business days"] },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
    ],
    render: (v) => `# Business Associate Agreement (BAA)

Between ${val(v, "coveredEntity")} (“Covered Entity”) and ${val(v, "businessAssociate")} (“Business Associate”), effective ${val(v, "effectiveDate")}.

## 1. Compliance with HIPAA
Business Associate agrees to comply with the Health Insurance Portability and Accountability Act of 1996 (“HIPAA”) privacy and security rules.

## 2. Permitted Uses & Safeguards
Business Associate will only use or disclose PHI for: ${val(v, "permittedUses", "Services specified in the underlying commercial agreement")}.

## 3. Breach Notification
Business Associate shall report any security incident or breach of unsecured PHI within ${val(v, "breachNoticeHours", "48 hours")} of becoming aware.

## 4. Governing Law
Laws of ${val(v, "governingLaw", "Delaware")}.
`,
  },
  {
    id: "software-license-agreement",
    name: "Software License Agreement",
    category: "Commercial",
    description: "On-premises or installed software licensing terms covering usage rights, restrictions, and warranties.",
    file: "templates/Software-License-Agreement.md",
    aliases: ["sla-software", "software-license"],
    fields: [
      { id: "licensor", label: "Licensor (Software Owner)", type: "text", placeholder: "CodeWorks Software Inc.", required: true },
      { id: "licensee", label: "Licensee (Customer)", type: "text", placeholder: "Industrial Dynamics Corp", required: true },
      { id: "softwareName", label: "Software Product Name", type: "text", placeholder: "EngineSuite Pro v4.0", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "licenseType", label: "License Type", type: "select", options: ["Non-exclusive, perpetual", "Annual subscription term", "Internal business use only", "Source-available developer license"] },
      { id: "licenseFee", label: "License Fee", type: "text", placeholder: "$25,000 one-time license fee" },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "California" },
    ],
    render: (v) => `# Software License Agreement

This Software License Agreement is between ${val(v, "licensor")} (“Licensor”) and ${val(v, "licensee")} (“Licensee”) effective ${val(v, "effectiveDate")}.

## 1. Grant of License
Licensor grants to Licensee a ${val(v, "licenseType", "non-exclusive, non-transferable")} license to install and execute ${val(v, "softwareName", "the Software")}.

## 2. License Fee
Licensee will pay: ${val(v, "licenseFee", "Applicable order fees")}.

## 3. Restrictions
Licensee shall not reverse engineer, decompile, redistribute, or sublicense the Software.

## 4. Governing Law
Laws of ${val(v, "governingLaw", "California")}.
`,
  },
  {
    id: "pilot-agreement",
    name: "Pilot Agreement",
    category: "Commercial",
    description: "Run a limited-scope trial, proof of concept (PoC), or product evaluation before commercial rollout.",
    file: "templates/Pilot-Agreement.md",
    aliases: ["pilot", "poc-agreement", "trial-agreement"],
    fields: [
      { id: "customer", label: "Customer / Evaluator", type: "text", placeholder: "Beta Enterprises Corp", required: true },
      { id: "vendor", label: "Vendor / Provider", type: "text", placeholder: "NextGen Software LLC", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "pilotScope", label: "Pilot Scope & Evaluation Objectives", type: "textarea", placeholder: "Testing automated invoice reconciliation in sandbox environment", required: true },
      { id: "duration", label: "Pilot Duration", type: "select", options: ["30 days", "60 days", "90 days", "14 days"] },
      { id: "fee", label: "Pilot Fee", type: "text", placeholder: "No charge / Free trial" },
      { id: "successCriteria", label: "Success Criteria", type: "textarea", placeholder: "Processing 500 transactions with >99% accuracy and mutual evaluation of ROI." },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
    ],
    render: (v) => `# Pilot Agreement

Between ${val(v, "vendor")} (“Provider”) and ${val(v, "customer")} (“Customer”), effective ${val(v, "effectiveDate")}.

## 1. Pilot Scope
Customer is granted evaluation access for: ${val(v, "pilotScope")}.

## 2. Duration & Fees
- **Pilot Period**: ${val(v, "duration", "60 days")} from Effective Date.
- **Fees**: ${val(v, "fee", "Free evaluation period")}.

## 3. Success Criteria
${val(v, "successCriteria", "Parties will evaluate technical and commercial fit in good faith.")}

## 4. Governing Law
Laws of ${val(v, "governingLaw", "Delaware")}.
`,
  },
  {
    id: "ai-addendum",
    name: "AI Addendum",
    category: "Addendum",
    description: "Terms governing artificial intelligence, model training rights, input privacy, and generated output ownership.",
    file: "templates/AI-Addendum.md",
    aliases: ["ai", "ai-terms", "llm-addendum"],
    fields: [
      { id: "provider", label: "Provider (AI Service)", type: "text", placeholder: "Cognitive AI Inc.", required: true },
      { id: "customer", label: "Customer", type: "text", placeholder: "Horizon Corp", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "modelTraining", label: "Customer Data Model Training", type: "select", options: ["Prohibited - Customer inputs and outputs will NOT be used to train models", "Permitted for model improvement only in de-identified aggregate form", "Permitted with opt-out"] },
      { id: "outputOwnership", label: "Output Ownership", type: "select", options: ["Customer owns all Output to the fullest extent permitted by law", "Mutual non-exclusive license", "Provider owns base model, Customer owns specific artifacts"] },
      { id: "humanOversight", label: "Human Oversight Clause", type: "select", options: ["Required for regulated or material decisions", "Recommended best practice", "Customer discretion"] },
      { id: "governingLaw", label: "Governing Law", type: "text", placeholder: "Delaware" },
    ],
    render: (v) => `# AI Addendum

This AI Addendum supplements the primary agreement between ${val(v, "provider")} (“Provider”) and ${val(v, "customer")} (“Customer”) as of ${val(v, "effectiveDate")}.

## 1. Model Training & Data Use
- **Training Policy**: ${val(v, "modelTraining", "Customer inputs and outputs are NOT used to train general AI models")}.
- Provider will respect data confidentiality and applicable privacy protections.

## 2. Output Ownership & Intellectual Property
- **Output Rights**: ${val(v, "outputOwnership", "Customer retains ownership of Output to the fullest extent permitted by law")}.

## 3. Disclaimers & Human Oversight
- ${val(v, "humanOversight", "Human oversight is required for sensitive decision-making")}. AI outputs are generated probabilistically.

## 4. Governing Law
Laws of ${val(v, "governingLaw", "Delaware")}.
`,
  },
];

export function getTemplateById(idOrAlias: string): LegalTemplate | undefined {
  const query = idOrAlias.toLowerCase().trim();
  return (
    legalTemplates.find(
      (t) =>
        t.id.toLowerCase() === query ||
        t.aliases?.some((a) => a.toLowerCase() === query)
    ) ||
    legalTemplates.find((t) => t.name.toLowerCase().includes(query))
  );
}

export type UnsupportedMatch = {
  unsupportedQuery: string;
  closestTemplateId: string;
  explanation: string;
  suggestedAction: string;
};

export const COMMON_UNSUPPORTED_DOCUMENTS: Record<
  string,
  { closestTemplateId: string; explanation: string; suggestedAction: string }
> = {
  employment: {
    closestTemplateId: "professional-services-agreement",
    explanation:
      "We cannot generate full W-2 Employment Contracts because Pre-Legal is designed for B2B commercial transactions and standard tech agreements.",
    suggestedAction:
      "We can generate a Professional Services Agreement (PSA), which is standard for independent contractors, consultants, and freelance service providers.",
  },
  contractor: {
    closestTemplateId: "professional-services-agreement",
    explanation:
      "For contractor work, our closest match is the Professional Services Agreement (PSA) which covers SOW scope, rates, IP assignment, and payment terms.",
    suggestedAction: "Use our Professional Services Agreement template.",
  },
  lease: {
    closestTemplateId: "cloud-service-agreement",
    explanation:
      "We cannot generate real estate or residential/commercial property leases.",
    suggestedAction:
      "If you are looking for software hosting or cloud infrastructure agreements, we offer our Cloud Service Agreement (CSA).",
  },
  will: {
    closestTemplateId: "mutual-nda",
    explanation:
      "We cannot generate personal legal documents like Wills, Trusts, or Estates. Pre-Legal focuses exclusively on business-to-business technology contracts.",
    suggestedAction:
      "Explore our commercial templates like the Mutual NDA or Professional Services Agreement for business needs.",
  },
  terms_of_service: {
    closestTemplateId: "cloud-service-agreement",
    explanation:
      "For consumer website Terms of Service, we don't have a consumer clickwrap template.",
    suggestedAction:
      "We offer the Cloud Service Agreement (CSA), which is the standard B2B agreement for SaaS and enterprise cloud subscriptions.",
  },
  privacy_policy: {
    closestTemplateId: "data-processing-agreement",
    explanation:
      "We don't generate public website Privacy Policies, but we provide the B2B Data Processing Agreement (DPA) and HIPAA Business Associate Agreement (BAA).",
    suggestedAction:
      "Use our Data Processing Agreement (DPA) to govern vendor and processor personal data handling.",
  },
  loan: {
    closestTemplateId: "partnership-agreement",
    explanation:
      "We do not offer banking, promissory note, or personal loan agreements.",
    suggestedAction:
      "If this is a strategic commercial or financial partnership, we offer the Partnership Agreement.",
  },
  reseller: {
    closestTemplateId: "partnership-agreement",
    explanation:
      "For channel and reseller relationships, our Partnership Agreement is the best fit.",
    suggestedAction:
      "Start a Partnership Agreement with revenue sharing and commercial terms.",
  },
};

export function findClosestTemplate(userQuery: string): {
  isSupported: boolean;
  template?: LegalTemplate;
  unsupportedInfo?: UnsupportedMatch;
} {
  const normalized = userQuery.toLowerCase().trim();

  // Check exact/partial supported templates
  const exact = getTemplateById(normalized);
  if (exact) {
    return { isSupported: true, template: exact };
  }

  // Check keyword matches in templates
  for (const t of legalTemplates) {
    const tokens = `${t.id} ${t.name} ${t.category} ${t.description} ${(t.aliases || []).join(" ")}`.toLowerCase();
    if (tokens.includes(normalized) || normalized.includes(t.name.toLowerCase())) {
      return { isSupported: true, template: t };
    }
  }

  // Check common unsupported documents
  for (const [key, info] of Object.entries(COMMON_UNSUPPORTED_DOCUMENTS)) {
    if (normalized.includes(key)) {
      const closest = legalTemplates.find((t) => t.id === info.closestTemplateId);
      return {
        isSupported: false,
        template: closest,
        unsupportedInfo: {
          unsupportedQuery: userQuery,
          closestTemplateId: info.closestTemplateId,
          explanation: info.explanation,
          suggestedAction: info.suggestedAction,
        },
      };
    }
  }

  // General fallback for unsupported query
  return {
    isSupported: false,
    template: legalTemplates[0], // fallback to Mutual NDA or PSA
    unsupportedInfo: {
      unsupportedQuery: userQuery,
      closestTemplateId: "mutual-nda",
      explanation: `We cannot generate "${userQuery}" because Pre-Legal currently specializes in Common Paper B2B technology and commercial agreements.`,
      suggestedAction:
        "We offer standard agreements for Confidentiality (Mutual NDA), SaaS (Cloud Service Agreement), Services (PSA), Privacy (DPA, BAA), Trials (Pilot), and AI (AI Addendum). Would you like to use one of these?",
    },
  };
}

export function createDocument(template: LegalTemplate): PreLegalDocument {
  const today = new Date().toISOString().slice(0, 10);
  const values = Object.fromEntries(
    template.fields.map((field) => [
      field.id,
      field.type === "date" ? today : field.type === "select" ? field.options?.[0] ?? "" : "",
    ])
  );

  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    title: `${template.name} Draft`,
    status: "Draft",
    updatedAt: today,
    values,
  };
}
