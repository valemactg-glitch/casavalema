import { PageIntro, Section } from "@/components/site/Section";

export default function Loading() {
  return (
    <>
      <PageIntro kicker="Habitaciones" title="Elige dónde dormir" />
      <Section>
        <div className="h-16 animate-pulse rounded-lg bg-surface-warm" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="grid gap-4 rounded-lg border border-hairline bg-white p-4 sm:grid-cols-[220px_1fr_200px]"
            >
              <div className="aspect-[4/3] animate-pulse rounded-md bg-surface-warm" />
              <div className="space-y-2.5">
                <div className="h-5 w-1/3 animate-pulse rounded bg-surface-warm" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-warm" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-warm" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-surface-warm" />
              </div>
              <div className="space-y-2 border-t border-hairline pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="h-7 w-2/3 animate-pulse rounded bg-surface-warm" />
                <div className="h-9 w-full animate-pulse rounded-pill bg-surface-warm" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
