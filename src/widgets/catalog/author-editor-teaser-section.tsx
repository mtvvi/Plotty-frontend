import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

interface AuthorEditorTeaserSectionProps {
  title: string;
  status: string;
  summary: string;
  highlights: string[];
}

export function AuthorEditorTeaserSection({
  title,
  status,
  summary,
  highlights,
}: AuthorEditorTeaserSectionProps) {
  return (
    <section className="plotty-frame">
      <div className="grid gap-6 px-7 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--plotty-muted)]">
              Вход в рабочий режим автора
            </span>
            <h2 className="plotty-serif text-4xl font-semibold leading-tight">
              Компактная точка входа в редактор
            </h2>
            <p className="text-sm leading-7 text-[var(--plotty-muted)]">
              Второй фрейм фиксирует следующий этап: после каталога пользователь должен без лишних переходов
              попадать в свой черновик и запускать AI-проверки уже после написания главы.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Новая глава</Button>
              <Button>Продолжить черновик</Button>
            </div>
          </div>
        </Card>

        <Card className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="text-sm text-[var(--plotty-muted)]">{status}</p>
            </div>

            <div className="rounded-2xl bg-[var(--plotty-panel)] p-4">
              <div className="mb-2 text-sm font-semibold">Сводка предыдущих глав</div>
              <p className="text-sm leading-6 text-[var(--plotty-muted)]">{summary}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Подсказки Plotty AI</div>
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl bg-[var(--plotty-paper-strong)] px-3 py-3 text-sm text-[var(--plotty-muted)]"
              >
                {highlight}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

