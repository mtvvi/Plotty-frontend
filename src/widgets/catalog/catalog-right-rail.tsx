import type { AiPromoBlock, AuthorDraftTeaser, TrendingFandom } from "@/entities/catalog/model/types";
import { Card } from "@/shared/ui/card";
import { Section } from "@/shared/ui/section";

interface CatalogRightRailProps {
  aiPromo: AiPromoBlock;
  trending: TrendingFandom[];
  draft: AuthorDraftTeaser;
}

export function CatalogRightRail({ aiPromo, trending, draft }: CatalogRightRailProps) {
  return (
    <aside className="space-y-4">
      <Card className="p-4">
        <Section title={aiPromo.title} description={aiPromo.description}>
          <ul className="space-y-2 text-sm leading-6 text-[var(--plotty-muted)]">
            {aiPromo.features.map((feature) => (
              <li key={feature} className="rounded-2xl bg-[var(--plotty-panel)] px-3 py-2.5">
                {feature}
              </li>
            ))}
          </ul>
        </Section>
      </Card>

      <Card className="p-4">
        <Section title="Популярные фандомы">
          <ul className="space-y-2 text-sm">
            {trending.map((fandom) => (
              <li key={fandom.id} className="flex items-center justify-between gap-4">
                <span>{fandom.name}</span>
                <span className="text-[var(--plotty-muted)]">{fandom.stories.toLocaleString("ru-RU")}</span>
              </li>
            ))}
          </ul>
        </Section>
      </Card>

      <Card className="p-4">
        <Section title="Черновик автора" description={draft.status}>
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{draft.title}</h3>
            <p className="text-sm leading-6 text-[var(--plotty-muted)]">{draft.summary}</p>
            <div className="space-y-2">
              {draft.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl bg-[var(--plotty-panel)] px-3 py-2.5 text-sm text-[var(--plotty-muted)]"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </Section>
      </Card>
    </aside>
  );
}

