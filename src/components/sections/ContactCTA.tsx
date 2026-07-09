import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowUpRight } from "lucide-react";

export function ContactCTA({
  email,
  resumeUrl,
}: {
  email?: string | null;
  resumeUrl?: string | null;
}) {
  return (
    <section id="contact" className="py-24 sm:py-32">
      <Container>
        <Reveal className="rounded-[var(--radius-xl)] border border-border bg-surface-2 p-10 sm:p-16">
          <h2 className="max-w-2xl text-[var(--step-4)] font-semibold">
            Let&rsquo;s build something that ships.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--step-1)] text-muted">
            Open to product design and builder roles where speed, craft, and AI
            fluency compound.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {email && (
              <ButtonLink href={`mailto:${email}`} external>
                Get in touch <ArrowUpRight size={18} />
              </ButtonLink>
            )}
            {resumeUrl && (
              <ButtonLink href={resumeUrl} variant="secondary" external>
                Résumé
              </ButtonLink>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
