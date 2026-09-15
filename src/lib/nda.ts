export type PartyInfo = {
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
  signature: string;
};

export type NdaFormData = {
  purpose: string;
  effectiveDate: string;
  mndaTermMode: "expires" | "continues";
  mndaTermYears: string;
  confidentialityMode: "years" | "perpetuity";
  confidentialityYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
};

export const emptyParty = (): PartyInfo => ({
  printName: "",
  title: "",
  company: "",
  noticeAddress: "",
  date: "",
  signature: "",
});

export const defaultNdaForm = (): NdaFormData => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: today,
    mndaTermMode: "expires",
    mndaTermYears: "1",
    confidentialityMode: "years",
    confidentialityYears: "1",
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: { ...emptyParty(), date: today },
    party2: { ...emptyParty(), date: today },
  };
};

export function display(value: string, fallback = "___________"): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
