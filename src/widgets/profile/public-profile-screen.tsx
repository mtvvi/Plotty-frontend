"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authKeys, logout, updateProfile, uploadAvatar } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { myShelfQueryOptions, readerShelfLabels, readerShelfOptions } from "@/entities/library/api/library-api";
import type { ReaderShelf } from "@/entities/library/model/types";
import {
  publicProfileQueryOptions,
  publicUserCollectionsQueryOptions,
  publicUserStoriesQueryOptions,
} from "@/entities/profile/api/profile-api";
import { myStoriesQueryOptions, storyKeys } from "@/entities/story/api/stories-api";
import { ApiError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { usernameValidationMessage } from "@/shared/lib/username";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldError, FieldHint, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { TabButton } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";

import { ProfileCollectionsManager } from "./profile-collections-manager";

type ProfileTab = "works" | "collections" | "library";
type LibraryTab = "all" | ReaderShelf;

const ownStoriesQuery = {
  tags: [],
  q: "",
  page: 1,
  pageSize: 100,
};

export function PublicProfileScreen({ username }: { username: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const normalizedUsername = username.trim();
  const isOwnProfile = Boolean(user?.username && user.username.toLowerCase() === normalizedUsername.toLowerCase());
  const initialTab = getInitialTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    !isOwnProfile && initialTab === "library" ? "collections" : initialTab,
  );
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const profileQuery = useQuery(publicProfileQueryOptions(normalizedUsername));
  const publicStoriesQuery = useQuery(publicUserStoriesQueryOptions(normalizedUsername));
  const ownStories = useQuery(myStoriesQueryOptions(ownStoriesQuery, { userId: isOwnProfile ? user?.id : null }));
  const collectionsQuery = useQuery(publicUserCollectionsQueryOptions(normalizedUsername));
  const shelfQuery = useQuery(myShelfQueryOptions(null, { enabled: isOwnProfile }));
  const visibleShelfEntries = useMemo(() => {
    const entries = shelfQuery.data?.items ?? [];

    return libraryTab === "all" ? entries : entries.filter((entry) => entry.shelf === libraryTab);
  }, [libraryTab, shelfQuery.data?.items]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.session() }),
        queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      ]);
      setEditOpen(false);

      const nextUsername = response.user.username;

      if (nextUsername && nextUsername !== normalizedUsername) {
        router.replace(routes.user(nextUsername));
      }
    },
  });
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onMutate: () => setAvatarError(null),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.session() }),
        queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      ]);
    },
    onError: (error) => {
      setAvatarError(error instanceof ApiError ? error.message : "Не удалось загрузить аватар");
    },
  });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      queryClient.removeQueries({ queryKey: storyKeys.all });
    },
  });

  useEffect(() => {
    const nextTab = getInitialTab(searchParams.get("tab"));

    setActiveTab(!isOwnProfile && nextTab === "library" ? "collections" : nextTab);
  }, [isOwnProfile, searchParams]);

  useEffect(() => {
    const profile = profileQuery.data;

    if (!profile || !isOwnProfile || editOpen) {
      return;
    }

    setUsernameDraft(profile.username);
    setBioDraft(profile.bio ?? "");
  }, [editOpen, isOwnProfile, profileQuery.data]);

  if (profileQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="Профиль загружается"
        pageDescription="Подтягиваем автора, работы и библиотеку."
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyPageShell>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PlottyPageShell
        pageTitle="Профиль не найден"
        pageDescription="Такого пользователя нет или профиль недоступен."
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <EmptyState title="Профиль не найден" description="Проверьте ник пользователя или вернитесь в каталог." />
      </PlottyPageShell>
    );
  }

  const profile = profileQuery.data;
  const stories = isOwnProfile ? ownStories.data?.items ?? [] : publicStoriesQuery.data?.items ?? [];
  const collections = collectionsQuery.data?.items ?? [];
  const clientUsernameError = usernameValidationMessage(usernameDraft);
  const serverError = updateProfileMutation.error instanceof ApiError ? updateProfileMutation.error.message : null;

  function handleStartEdit() {
    setUsernameDraft(profile.username);
    setBioDraft(profile.bio ?? "");
    setAvatarError(null);
    setEditOpen(true);
  }

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();

    if (clientUsernameError) {
      return;
    }

    updateProfileMutation.mutate({
      username: usernameDraft.trim(),
      bio: bioDraft.trim(),
    });
  }

  function handleAvatarChange(file: File | null) {
    if (file) {
      avatarMutation.mutate(file);
    }
  }

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    router.replace(routes.home);
    router.refresh();
  }

  return (
    <PlottyPageShell suppressPageIntro menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}>
      <div className="space-y-5">
        <PlottySectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5 p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ProfileAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="large" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="plotty-kicker">{isOwnProfile ? "Мой профиль" : "Профиль"}</div>
                  <h1 className="plotty-page-title">{profile.username}</h1>
                  {profile.bio ? (
                    <p className="plotty-body max-w-3xl text-[var(--plotty-muted)]">{profile.bio}</p>
                  ) : (
                    <p className="plotty-meta">Описание профиля пока не заполнено.</p>
                  )}
                </div>
                {isOwnProfile ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={handleStartEdit}>
                      Редактировать
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleLogout} disabled={logoutMutation.isPending}>
                      {logoutMutation.isPending ? "Выходим..." : "Выйти"}
                    </Button>
                  </div>
                ) : null}
              </div>

              {isOwnProfile && editOpen ? (
                <form className="grid gap-4 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4" onSubmit={handleSaveProfile}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="own-profile-username">Ник</FieldLabel>
                      <Input
                        id="own-profile-username"
                        value={usernameDraft}
                        onChange={(event) => setUsernameDraft(event.target.value)}
                        disabled={updateProfileMutation.isPending}
                      />
                      <FieldHint>Латиница, цифры и “_”, от 3 до 40 символов.</FieldHint>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="own-profile-avatar">Аватар</FieldLabel>
                      <Input
                        id="own-profile-avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        disabled={avatarMutation.isPending}
                        onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                      />
                      <FieldHint>PNG, JPG, WEBP или GIF до 5 МБ.</FieldHint>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="own-profile-bio">О себе</FieldLabel>
                    <Textarea
                      id="own-profile-bio"
                      value={bioDraft}
                      onChange={(event) => setBioDraft(event.target.value)}
                      disabled={updateProfileMutation.isPending}
                      className="min-h-32"
                      maxLength={5000}
                    />
                  </Field>
                  {clientUsernameError ? <FieldError>{clientUsernameError}</FieldError> : null}
                  {!clientUsernameError && serverError ? <FieldError>{serverError}</FieldError> : null}
                  {avatarError ? <FieldError>{avatarError}</FieldError> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="primary" disabled={updateProfileMutation.isPending || Boolean(clientUsernameError)}>
                      {updateProfileMutation.isPending ? "Сохраняем..." : "Сохранить"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} disabled={updateProfileMutation.isPending}>
                      Отмена
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
            <div className="grid gap-3 border-t border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-5 lg:border-l lg:border-t-0">
              <ProfileStat label="Работ" value={(isOwnProfile ? ownStories.data?.pagination.total : publicStoriesQuery.data?.pagination.total) ?? stories.length} />
              <ProfileStat label={isOwnProfile ? "В библиотеке" : "Подборок"} value={isOwnProfile ? shelfQuery.data?.items.length ?? 0 : collections.length} />
            </div>
          </div>
        </PlottySectionCard>

        <div className="plotty-segmented">
          <TabButton type="button" isActive={activeTab === "works"} onClick={() => setActiveTab("works")}>
            Творчество
          </TabButton>
          <TabButton type="button" isActive={activeTab === "collections"} onClick={() => setActiveTab("collections")}>
            Публичные подборки
          </TabButton>
          {isOwnProfile ? (
            <TabButton type="button" isActive={activeTab === "library"} onClick={() => setActiveTab("library")}>
              Библиотека
            </TabButton>
          ) : null}
        </div>

        {activeTab === "works" ? (
          <PlottySectionCard
            title="Творчество"
            description={isOwnProfile ? "Ваши работы." : "Публичный список опубликованных работ автора."}
          >
            {(isOwnProfile ? ownStories.isLoading : publicStoriesQuery.isLoading) ? (
              <div className="space-y-3">
                <div className="h-44 rounded-[22px] bg-white/50" />
                <div className="h-44 rounded-[22px] bg-white/50" />
              </div>
            ) : stories.length ? (
              <div className="space-y-4">
                {stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    showShelfControl={!isOwnProfile}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Работ пока нет" description={isOwnProfile ? "Создайте первую историю в мастерской." : "У пользователя нет опубликованных историй."} />
            )}
          </PlottySectionCard>
        ) : null}

        {activeTab === "collections" ? (
          isOwnProfile ? (
            <PlottySectionCard>
              <ProfileCollectionsManager username={profile.username} />
            </PlottySectionCard>
          ) : (
            <PlottySectionCard title="Публичные подборки" description="Подборки, которыми пользователь поделился с читателями.">
              {collectionsQuery.isLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-36 rounded-[22px] bg-white/50" />
                  <div className="h-36 rounded-[22px] bg-white/50" />
                </div>
              ) : collections.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={routes.userCollection(profile.username, collection.id)}
                      className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/78 p-4 transition-[background-color,transform] hover:-translate-y-[1px] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
                    >
                      <div className="space-y-2">
                        <div className="plotty-card-title text-[1.2rem]">{collection.title}</div>
                        {collection.description ? (
                          <p className="plotty-body line-clamp-3 text-sm leading-6 text-[var(--plotty-muted)]">
                            {collection.description}
                          </p>
                        ) : null}
                        <div className="plotty-meta">
                          {collection.storiesCount} {getStoryLabel(collection.storiesCount)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="Публичных подборок пока нет" description="Приватные статусы чтения в чужом профиле не показываются." />
              )}
            </PlottySectionCard>
          )
        ) : null}

        {activeTab === "library" && isOwnProfile ? (
          <PlottySectionCard title="Библиотека" description="Ваши приватные статусы чтения.">
              <div className="mb-4 flex flex-wrap gap-2">
                <TabButton type="button" isActive={libraryTab === "all"} onClick={() => setLibraryTab("all")}>
                  Все
                </TabButton>
                {readerShelfOptions.map((option) => (
                  <TabButton key={option.value} type="button" isActive={libraryTab === option.value} onClick={() => setLibraryTab(option.value)}>
                    {option.label}
                  </TabButton>
                ))}
              </div>
              {shelfQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-44 rounded-[22px] bg-white/50" />
                  <div className="h-44 rounded-[22px] bg-white/50" />
                </div>
              ) : visibleShelfEntries.length ? (
                <div className="space-y-4">
                  {visibleShelfEntries.map((entry) => (
                    <div key={`${entry.storyId}-${entry.shelf}`} className="space-y-2">
                      <div className="plotty-meta">{`Статус: ${readerShelfLabels[entry.shelf]}`}</div>
                      <StoryCard story={entry.story} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Здесь пока пусто" description="Добавьте статус чтения на странице истории или в каталоге." />
              )}
            </PlottySectionCard>
        ) : null}
      </div>
    </PlottyPageShell>
  );
}

export function ProfileAvatar({
  username,
  avatarUrl,
  size = "normal",
}: {
  username: string;
  avatarUrl?: string | null;
  size?: "normal" | "large";
}) {
  const className = size === "large" ? "size-24 text-3xl sm:size-28" : "size-12 text-base";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`Аватар ${username}`}
        className={`${className} shrink-0 rounded-full border border-[rgba(41,38,34,0.08)] object-cover`}
      />
    );
  }

  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[rgba(188,95,61,0.12)] font-bold text-[var(--plotty-accent)]`}>
      {username.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/70 p-4">
      <div className="text-2xl font-bold text-[var(--plotty-ink)]">{value.toLocaleString("ru-RU")}</div>
      <div className="plotty-meta">{label}</div>
    </div>
  );
}

function getInitialTab(value: string | null): ProfileTab {
  if (value === "library" || value === "collections") {
    return value;
  }

  return "works";
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
