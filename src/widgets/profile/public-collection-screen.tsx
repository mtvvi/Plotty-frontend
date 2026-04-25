"use client";

import { useQuery } from "@tanstack/react-query";

import { publicUserCollectionQueryOptions } from "@/entities/profile/api/profile-api";
import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";

export function PublicCollectionScreen({
  username,
  collectionId,
}: {
  username: string;
  collectionId: string;
}) {
  const collectionQuery = useQuery(publicUserCollectionQueryOptions(username, collectionId));

  if (collectionQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="Подборка загружается"
        pageDescription="Собираем список историй."
        showMobileBack
        mobileBackHref={routes.user(username)}
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyPageShell>
    );
  }

  if (collectionQuery.isError || !collectionQuery.data) {
    return (
      <PlottyPageShell
        pageTitle="Подборка не найдена"
        pageDescription="Она могла быть удалена или принадлежит другому пользователю."
        showMobileBack
        mobileBackHref={routes.user(username)}
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <EmptyState title="Подборка не найдена" description="Вернитесь в профиль пользователя и выберите другую подборку." />
      </PlottyPageShell>
    );
  }

  const collection = collectionQuery.data;

  return (
    <PlottyPageShell
      pageTitle={collection.title}
      pageDescription={collection.description ?? "Публичная подборка историй."}
      pageActions={
        <ButtonLink href={`${routes.user(username)}?tab=library`} variant="secondary">
          К профилю
        </ButtonLink>
      }
      showMobileBack
      mobileBackHref={routes.user(username)}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      <PlottySectionCard
        title={`${collection.stories.length} ${getStoryLabel(collection.stories.length)}`}
        description={`Обновлена ${new Date(collection.updatedAt).toLocaleDateString("ru-RU")}`}
      >
        {collection.stories.length ? (
          <div className="space-y-4">
            {collection.stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <EmptyState title="В подборке пока нет историй" description="Автор подборки еще не добавил публичные работы." />
        )}
      </PlottySectionCard>
    </PlottyPageShell>
  );
}

function getStoryLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "история";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "истории";
  }

  return "историй";
}
