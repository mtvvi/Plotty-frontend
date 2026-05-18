"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authKeys, logout, updateProfile, uploadAvatar } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { myShelfQueryOptions } from "@/entities/library/api/library-api";
import {
  publicProfileQueryOptions,
  publicUserCollectionsQueryOptions,
  publicUserStoriesQueryOptions,
} from "@/entities/profile/api/profile-api";
import { myStoriesQueryOptions } from "@/entities/story/api/stories-api";
import { routes } from "@/shared/config/routes";
import { usernameValidationMessage } from "@/shared/lib/username";
import { toUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldError, FieldHint, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { AnimatedList, AnimatedTabPanel } from "@/shared/ui/motion";
import { SegmentedControl, TabButton } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";
import { resetViewerSessionCache } from "@/widgets/auth/viewer-session-cache";

import { ProfileCollectionsManager } from "./profile-collections-manager";
import {
  CreativityIcon,
  EditProfileIcon,
  LogoutProfileIcon,
  ProfileFileIcon,
  ProfileLibraryIcon,
  PublicCollectionsIcon,
} from "./profile-icons";

type ProfileTab = "works" | "collections";

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
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarDraftFile, setAvatarDraftFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const profileQuery = useQuery(publicProfileQueryOptions(normalizedUsername));
  const publicStoriesQuery = useQuery(publicUserStoriesQueryOptions(normalizedUsername));
  const ownStories = useQuery(myStoriesQueryOptions(ownStoriesQuery, { userId: isOwnProfile ? user?.id : null }));
  const collectionsQuery = useQuery(publicUserCollectionsQueryOptions(normalizedUsername));
  const shelfQuery = useQuery(myShelfQueryOptions(null, { enabled: isOwnProfile }));

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
      setAvatarError(toUserFacingErrorMessage(error, "Не удалось загрузить аватар"));
    },
  });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await resetViewerSessionCache(queryClient);
    },
  });

  useEffect(() => {
    const nextTab = getInitialTab(searchParams.get("tab"));

    setActiveTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    const profile = profileQuery.data;

    if (!profile || !isOwnProfile || editOpen) {
      return;
    }

    setUsernameDraft(profile.username);
    setBioDraft(profile.bio ?? "");
  }, [editOpen, isOwnProfile, profileQuery.data]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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
  const serverError = updateProfileMutation.error
    ? toUserFacingErrorMessage(updateProfileMutation.error, "Не удалось обновить профиль")
    : null;

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
      setAvatarError(null);
      setAvatarDraftFile(file);
      setAvatarScale(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
      setAvatarPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return URL.createObjectURL(file);
      });
    }
  }

  function resetAvatarDraft() {
    setAvatarDraftFile(null);
    setAvatarScale(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return "";
    });

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  async function handleConfirmAvatarCrop() {
    if (!avatarDraftFile) {
      return;
    }

    try {
      const croppedFile = await cropAvatarFile(avatarDraftFile, {
        offsetX: avatarOffsetX,
        offsetY: avatarOffsetY,
        scale: avatarScale,
      });

      avatarMutation.mutate(croppedFile);
      resetAvatarDraft();
    } catch {
      setAvatarError("Не удалось подготовить аватар. Выберите другое изображение.");
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
        <PlottySectionCard className="plotty-panel-enter overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5 p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {isOwnProfile ? (
                  <>
                    <input
                      ref={avatarInputRef}
                      id="own-profile-avatar"
                      className="plotty-avatar-upload-input sr-only"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={avatarMutation.isPending}
                      onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-[var(--plotty-radius-md)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarMutation.isPending}
                      aria-label="Загрузить аватар"
                      title="Загрузить аватар"
                    >
                      <ProfileAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="large" />
                    </button>
                  </>
                ) : (
                  <ProfileAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="large" />
                )}
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
                      <EditProfileIcon className="size-5 shrink-0" />
                      Редактировать
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleLogout} disabled={logoutMutation.isPending}>
                      <LogoutProfileIcon className="size-5 shrink-0" />
                      {logoutMutation.isPending ? "Выходим..." : "Выйти"}
                    </Button>
                  </div>
                ) : null}
              </div>

              {isOwnProfile && editOpen ? (
                <form className="plotty-profile-settings-enter grid gap-4 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4" onSubmit={handleSaveProfile}>
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
                      <label className="plotty-avatar-upload" htmlFor="own-profile-avatar" aria-disabled={avatarMutation.isPending}>
                        <span className="plotty-avatar-upload-icon" aria-hidden="true">
                          <Plus className="size-5" strokeWidth={2.2} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-[var(--plotty-ink)]">
                            {avatarMutation.isPending ? "Загружаем аватар..." : "Загрузить аватар"}
                          </span>
                          <span className="mt-1 block text-sm text-[var(--plotty-muted)]">Выберите файл с изображением</span>
                        </span>
                      </label>
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
              <ProfileStat
                label="Работ"
                value={(isOwnProfile ? ownStories.data?.pagination.total : publicStoriesQuery.data?.pagination.total) ?? stories.length}
                icon={<ProfileFileIcon className="size-6" />}
              />
              <ProfileStat
                label={isOwnProfile ? "На полке" : "Подборок"}
                value={isOwnProfile ? shelfQuery.data?.items.length ?? 0 : collections.length}
                icon={isOwnProfile ? <ProfileLibraryIcon className="size-6" /> : <PublicCollectionsIcon className="size-6" />}
              />
            </div>
          </div>
        </PlottySectionCard>

        <SegmentedControl className="w-full !grid grid-cols-2 items-stretch">
          <TabButton type="button" className="inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 !px-2 !py-2 !text-xs leading-tight sm:gap-2 sm:!px-4 sm:!py-2.5 sm:!text-sm" isActive={activeTab === "works"} onClick={() => setActiveTab("works")}>
            <CreativityIcon className="size-4 shrink-0 sm:size-5" />
            <span className="min-w-0 text-center">Творчество</span>
          </TabButton>
          <TabButton type="button" className="inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 !px-2 !py-2 !text-xs leading-tight sm:gap-2 sm:!px-4 sm:!py-2.5 sm:!text-sm" isActive={activeTab === "collections"} onClick={() => setActiveTab("collections")}>
            <PublicCollectionsIcon className="size-4 shrink-0 sm:size-5" />
            <span className="min-w-0 text-center">Публичные подборки</span>
          </TabButton>
        </SegmentedControl>

        <AnimatedTabPanel activeKey={activeTab} panelKey="works">
          <PlottySectionCard
            title={<ProfileTitle icon={<CreativityIcon className="size-5" />}>{"Творчество"}</ProfileTitle>}
            description={isOwnProfile ? "Ваши работы" : "Публичный список опубликованных работ автора."}
          >
            {(isOwnProfile ? ownStories.isLoading : publicStoriesQuery.isLoading) ? (
              <div className="space-y-3">
                <div className="h-44 rounded-[22px] bg-white/50" />
                <div className="h-44 rounded-[22px] bg-white/50" />
              </div>
            ) : stories.length ? (
              <AnimatedList
                items={stories}
                getKey={(story) => story.id}
                className="space-y-4"
                renderItem={(story) => (
                  <StoryCard
                    story={story}
                    showShelfControl
                    showChapterActions={false}
                  />
                )}
              />
            ) : (
              <EmptyState title="Работ пока нет" description={isOwnProfile ? "Создайте первую историю в мастерской." : "У пользователя нет опубликованных историй."} />
            )}
          </PlottySectionCard>
        </AnimatedTabPanel>

        <AnimatedTabPanel activeKey={activeTab} panelKey="collections">
          {isOwnProfile ? (
            <PlottySectionCard>
              <ProfileCollectionsManager username={profile.username} />
            </PlottySectionCard>
          ) : (
            <PlottySectionCard
              title={<ProfileTitle icon={<PublicCollectionsIcon className="size-5" />}>{"Публичные подборки"}</ProfileTitle>}
              description="Подборки, которыми пользователь хочет поделиться"
            >
              {collectionsQuery.isLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-36 rounded-[22px] bg-white/50" />
                  <div className="h-36 rounded-[22px] bg-white/50" />
                </div>
              ) : collections.length ? (
                <AnimatedList
                  items={collections}
                  getKey={(collection) => collection.id}
                  className="grid gap-3 md:grid-cols-2"
                  itemClassName="h-full"
                  renderItem={(collection) => (
                    <Link
                      href={routes.userCollection(profile.username, collection.id)}
                      className="plotty-collection-tile plotty-lift-panel block h-full rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/78 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
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
                  )}
                />
              ) : (
                <EmptyState title="Публичных подборок пока нет" />
              )}
            </PlottySectionCard>
          )}
        </AnimatedTabPanel>
      </div>
      {avatarPreviewUrl && avatarDraftFile ? (
        <AvatarCropDialog
          imageUrl={avatarPreviewUrl}
          isSaving={avatarMutation.isPending}
          offsetX={avatarOffsetX}
          offsetY={avatarOffsetY}
          scale={avatarScale}
          onCancel={resetAvatarDraft}
          onConfirm={handleConfirmAvatarCrop}
          onOffsetXChange={setAvatarOffsetX}
          onOffsetYChange={setAvatarOffsetY}
          onScaleChange={setAvatarScale}
        />
      ) : null}
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
        className={`${className} shrink-0 rounded-[var(--plotty-radius-md)] border border-[rgba(41,38,34,0.08)] object-cover transition-[box-shadow,transform] duration-[var(--motion-base)] hover:scale-[1.02] hover:shadow-[0_14px_30px_rgba(58,43,27,0.12)]`}
      />
    );
  }

  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-[var(--plotty-radius-md)] bg-[rgba(188,95,61,0.12)] font-bold text-[var(--plotty-accent)] transition-[box-shadow,transform] duration-[var(--motion-base)] hover:scale-[1.02] hover:shadow-[0_14px_30px_rgba(58,43,27,0.12)]`}>
      {username.slice(0, 1).toUpperCase()}
    </div>
  );
}

function AvatarCropDialog({
  imageUrl,
  isSaving,
  offsetX,
  offsetY,
  onCancel,
  onConfirm,
  onOffsetXChange,
  onOffsetYChange,
  onScaleChange,
  scale,
}: {
  imageUrl: string;
  isSaving?: boolean;
  offsetX: number;
  offsetY: number;
  onCancel: () => void;
  onConfirm: () => void;
  onOffsetXChange: (value: number) => void;
  onOffsetYChange: (value: number) => void;
  onScaleChange: (value: number) => void;
  scale: number;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Закрыть обрезку аватара"
        className="absolute inset-0 bg-[rgba(31,26,22,0.42)] backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Обрезка аватара"
        className="relative w-full max-w-[30rem] rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[rgba(251,247,242,0.98)] p-5 shadow-[var(--plotty-shadow)]"
      >
        <div className="space-y-4">
          <div>
            <h2 className="plotty-section-title">Аватар</h2>
            <p className="plotty-meta">Отмасштабируйте и сдвиньте изображение перед загрузкой.</p>
          </div>
          <div className="mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="size-full object-cover"
              style={{
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
                transformOrigin: "center",
              }}
            />
          </div>
          <div className="grid gap-4">
            <AvatarRange label="Масштаб" max={2} min={1} step={0.05} value={scale} onChange={onScaleChange} />
            <AvatarRange label="Сдвиг по горизонтали" max={40} min={-40} step={1} value={offsetX} onChange={onOffsetXChange} />
            <AvatarRange label="Сдвиг по вертикали" max={40} min={-40} step={1} value={offsetY} onChange={onOffsetYChange} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="button" variant="primary" onClick={onConfirm} disabled={isSaving}>
              {isSaving ? "Загружаем..." : "Загрузить"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarRange({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="plotty-label">{label}</span>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="px-0"
      />
    </label>
  );
}

function loadAvatarImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function cropAvatarFile(
  file: File,
  options: {
    offsetX: number;
    offsetY: number;
    scale: number;
  },
) {
  const url = URL.createObjectURL(file);

  try {
    const image = await loadAvatarImage(url);
    const canvas = document.createElement("canvas");
    const size = 512;

    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is unavailable");
    }

    context.fillStyle = "#fff";
    context.fillRect(0, 0, size, size);

    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const drawWidth = image.naturalWidth * baseScale * options.scale;
    const drawHeight = image.naturalHeight * baseScale * options.scale;
    const drawX = (size - drawWidth) / 2 + (options.offsetX / 100) * size;
    const drawY = (size - drawHeight) / 2 + (options.offsetY / 100) * size;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));

    if (!blob) {
      throw new Error("Canvas export failed");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";

    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProfileTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex shrink-0 text-[var(--plotty-muted)]">{icon}</span>
      {children}
    </span>
  );
}

function ProfileStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="plotty-lift-panel rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-[var(--plotty-ink)]">{value.toLocaleString("ru-RU")}</div>
          <div className="plotty-meta">{label}</div>
        </div>
        <span className="mt-1 inline-flex shrink-0 text-[var(--plotty-muted)]">{icon}</span>
      </div>
    </div>
  );
}

function getInitialTab(value: string | null): ProfileTab {
  if (value === "collections") {
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
