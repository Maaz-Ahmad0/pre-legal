type Props = {
  firmName?: string;
  description?: string;
  reviewHref?: string;
  websiteHref?: string;
};

export function LegalHelpBanner({
  firmName = "G. M. Channa Law Associates",
  description,
  reviewHref = "#",
  websiteHref = "#",
}: Props) {
  const body =
    description ??
    `${firmName} can help review, customize, and guide you before using or filing a legal document. Schedule a consultation with our experienced legal team.`;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-[#0f3d2a] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h3 className="text-xl font-semibold sm:text-2xl">Need a Lawyer to Review Your Document?</h3>
        <p className="mt-2 max-w-xl text-sm text-white/80">{body}</p>
      </div>
      <div className="flex shrink-0 gap-3">
        <a
          href={reviewHref}
          className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-[#0f3d2a] transition hover:bg-white/90"
        >
          Request Document Review
        </a>
        <a
          href={websiteHref}
          className="rounded-full border border-white/60 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Visit Main Website
        </a>
      </div>
    </div>
  );
}
