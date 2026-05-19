"use client";

import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
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
import { cn } from "@/shared/lib/utils";
import { usernameValidationMessage } from "@/shared/lib/username";
import { toUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { FieldError } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { AnimatedList, AnimatedTabPanel } from "@/shared/ui/motion";
import { SegmentedControl, TabButton } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";
import { resetViewerSessionCache } from "@/widgets/auth/viewer-session-cache";

import { ProfileCollectionsManager } from "./profile-collections-manager";
import { getAvatarCropGeometry, getAvatarDragOffsets, type AvatarImageSize } from "./avatar-crop";
import {
  CreativityIcon,
  EditProfileIcon,
  LogoutProfileIcon,
  ProfileFileIcon,
  ProfileLibraryIcon,
  PublicCollectionsIcon,
} from "./profile-icons";

type ProfileTab = "works" | "collections";
type ProfileInlineField = "username" | "bio";

export const profileAvatarPlaceholderSrc = "/profile-avatar-placeholder.png";

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
  const [editingField, setEditingField] = useState<ProfileInlineField | null>(null);
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
      setEditingField(null);

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

    if (!profile || !isOwnProfile || editingField) {
      return;
    }

    setUsernameDraft(profile.username);
    setBioDraft(profile.bio ?? "");
  }, [editingField, isOwnProfile, profileQuery.data]);

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
      >
        <EmptyState title="Профиль не найден" description="Проверьте ник пользователя или вернитесь в каталог." />
      </PlottyPageShell>
    );
  }

  const profile = profileQuery.data;
  const worksQuery = isOwnProfile ? ownStories : publicStoriesQuery;
  const stories = worksQuery.data?.items ?? [];
  const collections = collectionsQuery.data?.items ?? [];
  const worksCount = worksQuery.isError ? "—" : worksQuery.data?.pagination.total ?? stories.length;
  const secondaryCount = isOwnProfile
    ? shelfQuery.isError
      ? "—"
      : shelfQuery.data?.items.length ?? 0
    : collectionsQuery.isError
      ? "—"
      : collections.length;
  const clientUsernameError = usernameValidationMessage(usernameDraft);
  const serverError = updateProfileMutation.error
    ? toUserFacingErrorMessage(updateProfileMutation.error, "Не удалось обновить профиль")
    : null;

  function handleStartInlineEdit(field: ProfileInlineField) {
    if (!isOwnProfile || updateProfileMutation.isPending) {
      return;
    }

    setUsernameDraft(profile.username);
    setBioDraft(profile.bio ?? "");
    setAvatarError(null);
    setEditingField(field);
  }

  function cancelInlineEdit() {
    setUsernameDraft(profile.username);
    setBioDraft(profile.bio ?? "");
    setEditingField(null);
  }

  function saveInlineEdit(field: ProfileInlineField) {
    if (!isOwnProfile || updateProfileMutation.isPending) {
      return;
    }

    if (field === "username" && clientUsernameError) {
      return;
    }

    const nextUsername = usernameDraft.trim();
    const nextBio = bioDraft.trim();
    const currentBio = profile.bio ?? "";

    if ((field === "username" && nextUsername === profile.username) || (field === "bio" && nextBio === currentBio)) {
      setEditingField(null);
      return;
    }

    updateProfileMutation.mutate({
      username: field === "username" ? nextUsername : profile.username,
      bio: field === "bio" ? nextBio : currentBio,
    });
  }

  function handleInlineFieldKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, field: ProfileInlineField) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelInlineEdit();
      return;
    }

    if (field === "username" && event.key === "Enter") {
      event.preventDefault();
      saveInlineEdit("username");
    }

    if (field === "bio" && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      saveInlineEdit("bio");
    }
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
    <PlottyPageShell suppressPageIntro>
      <div className="space-y-5">
        <PlottySectionCard className="plotty-panel-enter overflow-hidden !p-0">
          <div className="grid gap-0 lg:min-h-80 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div
                data-profile-summary-frame="true"
                className="p-0 lg:min-h-80"
              >
                <div className="flex w-full flex-col gap-0 sm:flex-row sm:items-stretch lg:grid lg:min-h-80 lg:grid-cols-[20rem_minmax(0,1fr)_auto] lg:gap-0">
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
                      <div className="grid w-full justify-items-stretch gap-0 sm:w-40 sm:shrink-0 lg:h-full lg:w-auto lg:self-stretch">
                        <button
                          type="button"
                          className="group relative w-full shrink-0 overflow-hidden rounded-none text-left transition-[box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-out-soft)] hover:shadow-[0_18px_34px_rgba(195,79,50,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:opacity-60 sm:rounded-[var(--plotty-radius-md)] sm:hover:-translate-y-0.5 lg:h-full lg:rounded-none lg:hover:translate-y-0"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={avatarMutation.isPending}
                          aria-label="Загрузить аватар"
                          title="Загрузить аватар"
                        >
                          <ProfileAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="hero" />
                          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-[rgba(195,79,50,0.76)] text-white opacity-0 transition-opacity duration-[var(--motion-base)] group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Plus className="size-8" strokeWidth={2.4} />
                          </span>
                          <span
                            data-avatar-mobile-plus="true"
                            className="pointer-events-none absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-[rgba(195,79,50,0.82)] text-white shadow-[0_10px_22px_rgba(195,79,50,0.2)] transition-[opacity,transform] duration-[var(--motion-base)] group-hover:scale-95 group-hover:opacity-0 sm:hidden"
                          >
                            <Plus className="size-5" strokeWidth={2.4} />
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <ProfileAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="hero" />
                  )}
                  <div className="min-w-0 flex-1 space-y-3 p-5 sm:p-6 lg:self-center lg:px-7 lg:py-7">
                    <ProfileInlineTextField
                      field="username"
                      label="Ник"
                      value={profile.username}
                      draftValue={usernameDraft}
                      editable={isOwnProfile}
                      isEditing={editingField === "username"}
                      isSaving={updateProfileMutation.isPending}
                      placeholder="Новый ник"
                      variant="title"
                      onDraftChange={setUsernameDraft}
                      onKeyDown={(event) => handleInlineFieldKeyDown(event, "username")}
                      onSave={() => saveInlineEdit("username")}
                      onStartEdit={() => handleStartInlineEdit("username")}
                    />
                    <ProfileInlineTextField
                      field="bio"
                      label="Описание"
                      value={profile.bio ?? ""}
                      fallback="Описание профиля пока не заполнено."
                      draftValue={bioDraft}
                      editable={isOwnProfile}
                      isEditing={editingField === "bio"}
                      isSaving={updateProfileMutation.isPending}
                      multiline
                      placeholder="Описание профиля"
                      variant="body"
                      onDraftChange={setBioDraft}
                      onKeyDown={(event) => handleInlineFieldKeyDown(event, "bio")}
                      onSave={() => saveInlineEdit("bio")}
                      onStartEdit={() => handleStartInlineEdit("bio")}
                    />
                    {editingField === "username" && clientUsernameError ? <FieldError>{clientUsernameError}</FieldError> : null}
                    {!clientUsernameError && serverError ? <FieldError>{serverError}</FieldError> : null}
                    {avatarError ? <FieldError>{avatarError}</FieldError> : null}
                  </div>
                  {isOwnProfile ? (
                    <div className="flex shrink-0 flex-wrap gap-2 px-5 pb-5 sm:self-center sm:px-0 sm:pb-0 sm:pr-6 lg:self-center lg:pr-7">
                      <Button type="button" variant="destructive" onClick={handleLogout} disabled={logoutMutation.isPending}>
                        <LogoutProfileIcon className="size-5 shrink-0" />
                        {logoutMutation.isPending ? "Выходим..." : "Выйти"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid auto-rows-fr gap-3 border-t border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <ProfileStat
                label="Работ"
                value={worksCount}
                icon={<ProfileFileIcon className="size-6" />}
              />
              <ProfileStat
                label={isOwnProfile ? "На полке" : "Подборок"}
                value={secondaryCount}
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
            {worksQuery.isLoading ? (
              <div className="space-y-3">
                <div className="h-44 rounded-[22px] bg-white/50" />
                <div className="h-44 rounded-[22px] bg-white/50" />
              </div>
            ) : worksQuery.isError ? (
              <EmptyState
                title="Работы недоступны"
                description="Не удалось загрузить список работ профиля."
                actionLabel="Повторить"
                onAction={() => void worksQuery.refetch()}
              />
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
              ) : collectionsQuery.isError ? (
                <EmptyState
                  title="Подборки недоступны"
                  description="Не удалось загрузить публичные подборки профиля."
                  actionLabel="Повторить"
                  onAction={() => void collectionsQuery.refetch()}
                />
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
  size?: "normal" | "large" | "hero";
}) {
  const className =
    size === "hero"
      ? "aspect-square w-full text-4xl sm:aspect-auto sm:h-full sm:min-h-40 lg:min-h-80 lg:text-5xl"
      : size === "large"
        ? "size-28 text-4xl sm:size-36 lg:size-40"
        : "size-12 text-base";
  const radiusClassName = size === "hero" ? "rounded-none sm:rounded-[var(--plotty-radius-md)] lg:rounded-none" : "rounded-[var(--plotty-radius-md)]";
  const imageSrc = avatarUrl ?? profileAvatarPlaceholderSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={`Аватар ${username}`}
      className={cn(
        className,
        radiusClassName,
        "shrink-0 border border-[rgba(41,38,34,0.08)] object-cover transition-[box-shadow,transform] duration-[var(--motion-base)] hover:scale-[1.02] hover:shadow-[0_14px_30px_rgba(58,43,27,0.12)] lg:hover:scale-100",
      )}
    />
  );
}

function ProfileInlineTextField({
  draftValue,
  editable,
  fallback,
  field,
  isEditing,
  isSaving,
  label,
  multiline = false,
  onDraftChange,
  onKeyDown,
  onSave,
  onStartEdit,
  placeholder,
  value,
  variant,
}: {
  draftValue: string;
  editable: boolean;
  fallback?: string;
  field: ProfileInlineField;
  isEditing: boolean;
  isSaving: boolean;
  label: string;
  multiline?: boolean;
  onDraftChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
  onStartEdit: () => void;
  placeholder: string;
  value: string;
  variant: "title" | "body";
}) {
  const fieldId = `own-profile-${field}`;
  const displayText = value.trim() || fallback || "";
  const editLabel = field === "username" ? "Редактировать ник" : "Редактировать описание";
  const iconLabel = field === "username" ? "Изменить ник" : "Изменить описание";
  const labelClassName = cn(
    "flex items-center gap-1.5",
    variant === "title" ? "mb-0.5" : "mb-1",
  );

  if (!editable) {
    if (variant === "title") {
      return <h1 className="plotty-page-title">{displayText}</h1>;
    }

    return value.trim() ? (
      <p className="plotty-body max-w-3xl text-[var(--plotty-muted)]">{displayText}</p>
    ) : (
      <p className="plotty-meta">{displayText}</p>
    );
  }

  return (
    <div className="min-w-0">
      <div className={labelClassName}>
        <label className="plotty-kicker" htmlFor={isEditing ? fieldId : undefined}>
          {label}
        </label>
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 text-[var(--plotty-accent)]"
          onClick={onStartEdit}
          disabled={isSaving}
          aria-label={iconLabel}
          title={iconLabel}
        >
          <EditProfileIcon className="size-4" />
        </IconButton>
      </div>
      {isEditing ? (
        multiline ? (
          <Textarea
            id={fieldId}
            aria-label={label}
            autoFocus
            value={draftValue}
            placeholder={placeholder}
            disabled={isSaving}
            className="h-24 min-h-24 max-h-24 max-w-3xl resize-none overflow-auto animate-in fade-in-0 zoom-in-95 duration-200"
            maxLength={5000}
            onBlur={onSave}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
        ) : (
          <Input
            id={fieldId}
            aria-label={label}
            autoFocus
            value={draftValue}
            placeholder={placeholder}
            disabled={isSaving}
            className="plotty-profile-username-input max-w-xl animate-in fade-in-0 zoom-in-95 duration-200"
            onBlur={onSave}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
        )
      ) : variant === "title" ? (
        <div className="group relative -mx-2 inline-block max-w-full rounded-[var(--plotty-radius-sm)] transition-[background-color,box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:bg-[var(--plotty-accent-wash)]">
          <h1 className="plotty-page-title px-2 py-0.5">{displayText}</h1>
          <button
            type="button"
            className="absolute inset-0 rounded-[var(--plotty-radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
            onClick={onStartEdit}
            disabled={isSaving}
            aria-label={editLabel}
          >
            <span className="sr-only">{editLabel}</span>
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "group relative -mx-2 max-w-3xl rounded-[var(--plotty-radius-sm)] transition-[background-color,box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:bg-[var(--plotty-accent-wash)]",
          )}
        >
          <p className={cn("px-2 py-1", value.trim() ? "plotty-body text-[var(--plotty-muted)]" : "plotty-meta")}>
            {displayText}
          </p>
          <button
            type="button"
            className="absolute inset-0 rounded-[var(--plotty-radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
            onClick={onStartEdit}
            disabled={isSaving}
            aria-label={editLabel}
          >
            <span className="sr-only">{editLabel}</span>
          </button>
        </div>
      )}
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
  const [imageSize, setImageSize] = useState<AvatarImageSize | null>(null);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const dragStateRef = useRef<{
    frameSize: number;
    maxOffsetX: number;
    maxOffsetY: number;
    offsetX: number;
    offsetY: number;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const cropGeometry = getAvatarCropGeometry(
    imageSize ?? { naturalHeight: 1, naturalWidth: 1 },
    { offsetX, offsetY, scale },
  );
  const canDragAvatar = cropGeometry.maxOffsetX > 0 || cropGeometry.maxOffsetY > 0;

  useEffect(() => {
    setImageSize(null);
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      dragStateRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cropGeometry.offsetX !== offsetX) {
      onOffsetXChange(cropGeometry.offsetX);
    }

    if (cropGeometry.offsetY !== offsetY) {
      onOffsetYChange(cropGeometry.offsetY);
    }
  }, [cropGeometry.offsetX, cropGeometry.offsetY, offsetX, offsetY, onOffsetXChange, onOffsetYChange]);

  function stopAvatarDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDraggingAvatar(false);
  }

  function handleAvatarPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canDragAvatar || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      frameSize: event.currentTarget.getBoundingClientRect().width,
      maxOffsetX: cropGeometry.maxOffsetX,
      maxOffsetY: cropGeometry.maxOffsetY,
      offsetX: cropGeometry.offsetX,
      offsetY: cropGeometry.offsetY,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDraggingAvatar(true);
  }

  function handleAvatarPointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const nextOffsets = getAvatarDragOffsets({
      currentOffsetX: dragState.offsetX,
      currentOffsetY: dragState.offsetY,
      deltaX: event.clientX - dragState.startX,
      deltaY: event.clientY - dragState.startY,
      frameSize: dragState.frameSize,
      maxOffsetX: dragState.maxOffsetX,
      maxOffsetY: dragState.maxOffsetY,
    });

    onOffsetXChange(nextOffsets.offsetX);
    onOffsetYChange(nextOffsets.offsetY);
  }

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
          <div
            aria-label="Переместить аватар"
            className={cn(
              "relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-white",
              canDragAvatar && "cursor-grab touch-none",
              isDraggingAvatar && "cursor-grabbing",
            )}
            data-avatar-crop-preview="true"
            onPointerCancel={stopAvatarDrag}
            onPointerDown={handleAvatarPointerDown}
            onPointerMove={handleAvatarPointerMove}
            onPointerUp={stopAvatarDrag}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none"
              onLoad={(event) => {
                setImageSize({
                  naturalHeight: event.currentTarget.naturalHeight || 1,
                  naturalWidth: event.currentTarget.naturalWidth || 1,
                });
              }}
              style={{
                height: `${cropGeometry.drawHeightPercent}%`,
                left: `calc(50% + ${cropGeometry.offsetX}%)`,
                top: `calc(50% + ${cropGeometry.offsetY}%)`,
                transform: "translate(-50%, -50%)",
                width: `${cropGeometry.drawWidthPercent}%`,
              }}
            />
          </div>
          <div className="grid gap-4">
            <AvatarRange label="Масштаб" max={2} min={1} step={0.05} value={scale} onChange={onScaleChange} />
            <AvatarRange
              label="Сдвиг по горизонтали"
              max={Math.ceil(cropGeometry.maxOffsetX)}
              min={-Math.ceil(cropGeometry.maxOffsetX)}
              step={1}
              value={cropGeometry.offsetX}
              onChange={onOffsetXChange}
              disabled={cropGeometry.maxOffsetX === 0}
            />
            <AvatarRange
              label="Сдвиг по вертикали"
              max={Math.ceil(cropGeometry.maxOffsetY)}
              min={-Math.ceil(cropGeometry.maxOffsetY)}
              step={1}
              value={cropGeometry.offsetY}
              onChange={onOffsetYChange}
              disabled={cropGeometry.maxOffsetY === 0}
            />
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
  disabled,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  disabled?: boolean;
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
        disabled={disabled}
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

    const cropGeometry = getAvatarCropGeometry(
      { naturalHeight: image.naturalHeight, naturalWidth: image.naturalWidth },
      options,
      size,
    );

    context.drawImage(image, cropGeometry.drawX, cropGeometry.drawY, cropGeometry.drawWidth, cropGeometry.drawHeight);

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

function ProfileStat({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  const displayValue = typeof value === "number" ? value.toLocaleString("ru-RU") : value;

  return (
    <div className="plotty-lift-panel h-full rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-[var(--plotty-ink)]">{displayValue}</div>
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
