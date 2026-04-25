import { storyTags } from "@/shared/config/story-tags";

import type {
  AiJobAccepted,
  AiJobStatus,
  AiJobType,
  ChapterDetails,
  ChapterListItem,
  CreateStoryCommentPayload,
  CreateChapterPayload,
  CreateStoryPayload,
  GeneratedImage,
  ImageGenerationPayload,
  ImageGenerationResult,
  LogicCheckResult,
  SpellcheckIssue,
  SpellcheckPayload,
  SpellcheckResult,
  StoryComment,
  StoriesQuery,
  StoriesResponse,
  StoryAuthor,
  StoryDetails,
  StoryListItem,
  StoryStatus,
  StoryTag,
  ToggleLikeResult,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "@/entities/story/model/types";
import type { AuthUser } from "@/entities/auth/model/types";
import type { ReaderShelf } from "@/entities/library/model/types";
import type { PublicUserProfile, UserCollectionDetail, UserCollectionSummary } from "@/entities/profile/model/types";

interface StoryRecord {
  id: string;
  slug: string;
  title: string;
  authorId: number;
  coverImageUrl?: string;
  description: string;
  status: StoryStatus;
  tagSlugs: string[];
  createdAt: string;
  updatedAt: string;
  fandom: string;
  pairing: string;
  ratingLabel: string;
  statusLabel: string;
  sizeLabel: string;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  viewsCount: number;
  likedByUserIds: number[];
  aiHint: string;
  summaryLabel: string;
  readLabel: string;
  updatedLabel: string;
}

interface CommentRecord {
  id: string;
  chapterId: string;
  authorId: number;
  authorUsername: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ChapterRecord {
  id: string;
  storyId: string;
  number: number;
  title: string;
  content: string;
  status?: "draft" | "published";
  imageUrl?: string;
  imagePrompt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AiJobRecord {
  id: string;
  type: AiJobType;
  chapterId: string;
  status: AiJobStatus;
  createdAt: number;
  readyAt: number;
  payload: SpellcheckPayload | ImageGenerationPayload;
  result?: SpellcheckResult | ImageGenerationResult | LogicCheckResult;
  errorMessage?: string;
}

interface ReaderShelfRecord {
  userId: number;
  storyId: string;
  shelf: ReaderShelf;
  updatedAt: string;
}

interface UserCollectionRecord {
  id: string;
  userId: number;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockStoriesDb {
  stories: StoryRecord[];
  chapters: ChapterRecord[];
  comments: CommentRecord[];
  shelves: ReaderShelfRecord[];
  collections: UserCollectionRecord[];
  collectionStories: Array<{ collectionId: string; storyId: string; createdAt: string }>;
  chapterViews: Array<{ chapterId: string; userId: number; createdAt: string }>;
  aiJobs: AiJobRecord[];
  jobSeed: number;
  storySeed: number;
  chapterSeed: number;
  commentSeed: number;
  collectionSeed: number;
  imageSeed: number;
}

const tagMap = new Map(storyTags.map((tag) => [tag.slug, tag]));
const multiMatchAnyCategories = new Set(["rating", "completion", "size"]);
const storyTagCategoryBySlug = new Map(storyTags.map((tag) => [tag.slug, tag.category ?? "other"]));
const storyAuthors: Record<number, StoryAuthor> = {
  1: {
    id: 1,
    username: "writer",
    avatarUrl: null,
  },
  101: {
    id: 101,
    username: "reader_one",
    avatarUrl: null,
  },
  102: {
    id: 102,
    username: "snowowl",
    avatarUrl: null,
  },
};

function normalizeTagLabel(value: string) {
  return value.trim().toLowerCase();
}

function resolveTagSlugsFromPayload(payload: { tagIds?: string[] }) {
  if (payload.tagIds?.length) {
    return payload.tagIds
      .map((tagId) => storyTags.find((tag) => tag.id === tagId)?.slug)
      .filter((slug): slug is string => Boolean(slug));
  }

  return [];
}

function createInitialDb(): MockStoriesDb {
  return {
    stories: [
      {
        id: "story-1",
        slug: "after-midnight-the-snow-does-not-melt",
        title: "После полуночи снег не тает",
        authorId: 1,
        description:
          "Гермиона пытается пережить восьмой курс, пока архив старого факультета вскрывает неудобные связи между прошлым и настоящим.",
        status: "published",
        tagSlugs: ["drama", "fantasy", "ooc"],
        createdAt: "2026-03-19T18:00:00.000Z",
        updatedAt: "2026-03-21T10:10:00.000Z",
        fandom: "Гарри Поттер",
        pairing: "Гермиона / Драко",
        ratingLabel: "R",
        statusLabel: "в процессе",
        sizeLabel: "миди",
        likesCount: 3482,
        commentsCount: 412,
        bookmarksCount: 1096,
        viewsCount: 12891,
        likedByUserIds: [],
        aiHint: "AI автора: 2 замечания по канону",
        summaryLabel: "Сводка для читателя",
        readLabel: "Читать",
        updatedLabel: "обновлено 2 часа назад",
      },
      {
        id: "story-2",
        slug: "ashes-and-salt",
        title: "Пепел для Белого Волка",
        authorId: 102,
        description:
          "Йеннифэр и Геральт снова идут по следу пропавшей карты, которая ведет к старому долгу и новым решениям.",
        status: "published",
        tagSlugs: ["adventure", "humor", "violence"],
        createdAt: "2026-03-18T14:00:00.000Z",
        updatedAt: "2026-03-20T11:45:00.000Z",
        fandom: "Ведьмак",
        pairing: "Геральт, Цири, Лютик",
        ratingLabel: "PG-13",
        statusLabel: "завершён",
        sizeLabel: "мини",
        likesCount: 1904,
        commentsCount: 188,
        bookmarksCount: 703,
        viewsCount: 7420,
        likedByUserIds: [],
        aiHint: "AI автора: читателю неясен переход сцены 4",
        summaryLabel: "Кратко по сюжету",
        readLabel: "Открыть",
        updatedLabel: "AI-сводка готова",
      },
      {
        id: "story-3",
        slug: "seventh-lantern-on-shadow-street",
        title: "Седьмой фонарь на Тенистой улице",
        authorId: 101,
        description:
          "Детективная линия в Средиземье, где почти каждый разговор одновременно допрос и попытка защитить близкого человека.",
        status: "published",
        tagSlugs: ["mysticism", "fantasy", "character-death"],
        createdAt: "2026-03-20T09:30:00.000Z",
        updatedAt: "2026-03-21T08:25:00.000Z",
        fandom: "Властелин Колец",
        pairing: "ОЖП / Фарамир",
        ratingLabel: "R",
        statusLabel: "в процессе",
        sizeLabel: "макси",
        likesCount: 4122,
        commentsCount: 531,
        bookmarksCount: 1544,
        viewsCount: 15984,
        likedByUserIds: [],
        aiHint: "AI автора: диалог можно сделать жёстче",
        summaryLabel: "Сводка по арке",
        readLabel: "Читать",
        updatedLabel: "обновлено вчера",
      },
      {
        id: "story-4",
        slug: "letters-without-an-owl-address",
        title: "Письма без адреса обратной совы",
        authorId: 102,
        description:
          "Эпистолярная история о доверии, памяти и аккуратно спрятанных чувствах в мире Гарри Поттера.",
        status: "published",
        tagSlugs: ["drama", "slice-of-life", "profanity"],
        createdAt: "2026-03-17T14:20:00.000Z",
        updatedAt: "2026-03-20T09:14:00.000Z",
        fandom: "Гарри Поттер",
        pairing: "Северус Снейп / OC",
        ratingLabel: "PG-13",
        statusLabel: "в процессе",
        sizeLabel: "макси",
        likesCount: 2116,
        commentsCount: 276,
        bookmarksCount: 930,
        viewsCount: 8105,
        likedByUserIds: [],
        aiHint: "AI автора: сводка прошлых глав обновлена",
        summaryLabel: "Что было раньше",
        readLabel: "Читать",
        updatedLabel: "сегодня, 09:14",
      },
      {
        id: "story-5",
        slug: "warmth-under-the-crystal-dome",
        title: "Тепло под кристальным куполом",
        authorId: 1,
        description:
          "История о деревне скрытого листа, где официальные поручения и личная верность постоянно ломают друг друга.",
        status: "published",
        tagSlugs: ["adventure", "fantasy", "violence"],
        createdAt: "2026-03-16T14:20:00.000Z",
        updatedAt: "2026-03-19T21:10:00.000Z",
        fandom: "Наруто",
        pairing: "Какаши / ОЖП",
        ratingLabel: "R",
        statusLabel: "завершён",
        sizeLabel: "миди",
        likesCount: 5003,
        commentsCount: 624,
        bookmarksCount: 1982,
        viewsCount: 18360,
        likedByUserIds: [],
        aiHint: "AI автора: OOC не найден",
        summaryLabel: "Сюжет за минуту",
        readLabel: "Открыть",
        updatedLabel: "AI-сводка для читателя",
      },
    ],
    chapters: [
      {
        id: "chapter-1",
        storyId: "story-1",
        number: 1,
        title: "Глава 1. Архив под лестницей",
        content:
          "Гермиона открыла архив слишком поздно, почти на ощупь. Внутри пахло пылью, сургучом и чем-то нечаяно забытым. Драко ждал у двери и делал вид, что это не его касается.",
        imageUrl:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'%3E%3Crect width='100%25' height='100%25' fill='%23253349'/%3E%3Ccircle cx='760' cy='264' r='156' fill='%23f7f2ea' fill-opacity='.14'/%3E%3Ctext x='72' y='160' fill='%23f7f2ea' font-size='50' font-family='Georgia'%3EПосле полуночи снег не тает%3C/text%3E%3Ctext x='72' y='248' fill='%23d9d2c4' font-size='30' font-family='Arial'%3EАрхив под лестницей%3C/text%3E%3C/svg%3E",
        imagePrompt: "Архив Хогвартса ночью, пыльный свет, кинематографично",
        createdAt: "2026-03-19T18:10:00.000Z",
        updatedAt: "2026-03-21T10:10:00.000Z",
      },
      {
        id: "chapter-2",
        storyId: "story-1",
        number: 2,
        title: "Глава 2. Сухой снег",
        content:
          "Наутро замок делал вид, будто ничего не произошло. Только бумага в кармане Гермионы шуршала слишком громко, а Драко говорил вообщем не то, что хотел.",
        createdAt: "2026-03-20T08:10:00.000Z",
        updatedAt: "2026-03-20T08:10:00.000Z",
      },
      {
        id: "chapter-3",
        storyId: "story-2",
        number: 1,
        title: "Глава 1. Соль на рукавах",
        content:
          "Йеннифэр заметила соль на рукавах ещё до того, как Геральт открыл дверь. Значит, дорога была длиннее обычного и рассказывал он не всё.",
        createdAt: "2026-03-18T14:10:00.000Z",
        updatedAt: "2026-03-20T11:45:00.000Z",
      },
      {
        id: "chapter-4",
        storyId: "story-3",
        number: 1,
        title: "Глава 1. Протокол и стекло",
        content:
          "Разбитые фонари еще пахли гарью, когда Фарамир разложил протоколы на столе. За сухими рапортами слишком явно проступало то, чего никто не решался вписать в официальный ход дела.",
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-21T08:25:00.000Z",
      },
      {
        id: "chapter-5",
        storyId: "story-4",
        number: 1,
        title: "Глава 1. Без обратного адреса",
        content:
          "Первое письмо пришло слишком аккуратно сложенным. Северус понял это раньше, чем прочитал хотя бы строку: пишущий слишком старался казаться спокойным.",
        createdAt: "2026-03-17T14:10:00.000Z",
        updatedAt: "2026-03-20T09:14:00.000Z",
      },
      {
        id: "chapter-6",
        storyId: "story-5",
        number: 1,
        title: "Глава 1. Купол давления",
        content:
          "Коноха любила говорить языком приказов, но Какаши слишком давно жил среди этих формул, чтобы не слышать момент, когда забота начинает звучать как давление.",
        createdAt: "2026-03-16T14:10:00.000Z",
        updatedAt: "2026-03-19T21:10:00.000Z",
      },
    ],
    comments: [
      {
        id: "comment-1",
        chapterId: "chapter-1",
        authorId: 101,
        authorUsername: "reader_one",
        authorEmail: "reader_one@plotty.test",
        content: "Очень хорошо держится ритм. Хочется быстрее открыть следующую главу.",
        createdAt: "2026-03-21T08:40:00.000Z",
        updatedAt: "2026-03-21T08:40:00.000Z",
      },
      {
        id: "comment-2",
        chapterId: "chapter-1",
        authorId: 102,
        authorUsername: "snowowl",
        authorEmail: "snowowl@plotty.test",
        content: "Архив и снег работают отлично. Было бы интересно больше напряжения в сцене у двери.",
        createdAt: "2026-03-21T09:12:00.000Z",
        updatedAt: "2026-03-21T09:12:00.000Z",
      },
    ],
    shelves: [
      {
        userId: 1,
        storyId: "story-1",
        shelf: "reading",
        updatedAt: "2026-03-21T11:00:00.000Z",
      },
    ],
    collections: [
      {
        id: "collection-1",
        userId: 1,
        title: "Фанфики по Гарри Поттеру от лица Драко",
        description: "Истории с камерной атмосферой, школьными архивами и фокусом на Драко.",
        createdAt: "2026-03-21T11:00:00.000Z",
        updatedAt: "2026-03-21T11:00:00.000Z",
      },
    ],
    collectionStories: [
      {
        collectionId: "collection-1",
        storyId: "story-1",
        createdAt: "2026-03-21T11:05:00.000Z",
      },
      {
        collectionId: "collection-1",
        storyId: "story-4",
        createdAt: "2026-03-21T11:06:00.000Z",
      },
    ],
    chapterViews: [
      {
        chapterId: "chapter-1",
        userId: 1,
        createdAt: "2026-03-21T11:10:00.000Z",
      },
    ],
    aiJobs: [],
    jobSeed: 1,
    storySeed: 6,
    chapterSeed: 7,
    commentSeed: 3,
    collectionSeed: 2,
    imageSeed: 1,
  };
}

let db = createInitialDb();

export function resetMockStoriesDb() {
  db = createInitialDb();
}

function nowIso() {
  return new Date().toISOString();
}

function resolveTags(tagSlugs: string[]): StoryTag[] {
  return tagSlugs.map((slug) => tagMap.get(slug)).filter(Boolean) as StoryTag[];
}

function getChaptersForStory(storyId: string): ChapterRecord[] {
  return db.chapters.filter((chapter) => chapter.storyId === storyId).sort((a, b) => a.number - b.number);
}

function toChapterListItem(chapter: ChapterRecord): ChapterListItem {
  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    updatedAt: chapter.updatedAt,
    status: chapter.status,
  };
}

function toStoryListItem(story: StoryRecord, viewerUserId?: number): StoryListItem {
  const chapters = getChaptersForStory(story.id);
  const visibleChapters = story.status === "published" ? chapters.filter((ch) => isChapterPublishedMock(ch)) : chapters;
  const tags = resolveTags(story.tagSlugs);

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    createdAt: story.createdAt,
    status: story.status,
    tags,
    chaptersCount: visibleChapters.length,
    updatedAt: story.updatedAt,
    fandom: tags.find((tag) => tag.category === "directionality")?.name,
    ratingLabel: tags.find((tag) => tag.category === "rating")?.name,
    statusLabel: tags.find((tag) => tag.category === "completion")?.name,
    sizeLabel: tags.find((tag) => tag.category === "size")?.name,
    likesCount: story.likesCount,
    viewerHasLiked: viewerUserId ? story.likedByUserIds.includes(viewerUserId) : false,
    aiHint: story.aiHint,
    author: storyAuthors[story.authorId] ?? null,
  };
}

function toStoryDetails(story: StoryRecord, viewerUserId?: number): StoryDetails {
  const chapters = getChaptersForStory(story.id);
  const visibleChapters = story.status === "published" ? chapters.filter((chapter) => isChapterPublishedMock(chapter)) : chapters;

  return {
    ...toStoryListItem(story, viewerUserId),
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    chapters: visibleChapters.map(toChapterListItem),
  };
}

function toChapterDetails(chapter: ChapterRecord): ChapterDetails {
  const story = db.stories.find((item) => item.id === chapter.storyId);

  if (!story) {
    throw new Error("Story not found for chapter");
  }

  return {
    id: chapter.id,
    storyId: story.id,
    storySlug: story.slug,
    storyTitle: story.title,
    storyTags: resolveTags(story.tagSlugs),
    storyChapters: getChaptersForStory(story.id).map(toChapterListItem),
    number: chapter.number,
    title: chapter.title,
    content: chapter.content,
    wordCount: countWords(chapter.content),
    updatedAt: chapter.updatedAt,
    imageUrl: chapter.imageUrl,
  };
}

function getStoryAuthorByUsername(username: string) {
  const normalized = username.trim().toLowerCase();

  return Object.values(storyAuthors).find((author) => author.username.toLowerCase() === normalized) ?? null;
}

export function getPublicProfile(username: string): PublicUserProfile | null {
  const author = getStoryAuthorByUsername(username);

  if (!author) {
    return null;
  }

  return {
    id: author.id,
    username: author.username,
    avatarUrl: author.avatarUrl,
    bio: author.username === "writer" ? "Автор и читатель Plotty." : null,
  };
}

export function listPublicStoriesByUsername(username: string, query: StoriesQuery, viewerUserId?: number) {
  const author = getStoryAuthorByUsername(username);

  if (!author) {
    return null;
  }

  const filtered = db.stories
    .filter((story) => story.authorId === author.id && story.status === "published")
    .filter((story) => (query.q ? story.title.toLowerCase().includes(query.q.toLowerCase()) : true))
    .filter((story) => matchesStoryTags(story, query.tags))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const start = (query.page - 1) * query.pageSize;
  const paged = filtered.slice(start, start + query.pageSize);

  return {
    items: paged.map((story) => toStoryListItem(story, viewerUserId)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
    },
  };
}

function toCollectionSummary(collection: UserCollectionRecord): UserCollectionSummary {
  return {
    ...collection,
    storiesCount: db.collectionStories.filter((item) => item.collectionId === collection.id).length,
  };
}

function toCollectionDetail(collection: UserCollectionRecord, viewerUserId?: number): UserCollectionDetail {
  const stories = db.collectionStories
    .filter((item) => item.collectionId === collection.id)
    .map((item) => db.stories.find((story) => story.id === item.storyId))
    .filter((story): story is StoryRecord => Boolean(story && story.status === "published"))
    .map((story) => toStoryListItem(story, viewerUserId));

  return {
    ...collection,
    stories,
  };
}

export function listUserCollectionsByUsername(username: string) {
  const author = getStoryAuthorByUsername(username);

  if (!author) {
    return null;
  }

  return {
    items: db.collections
      .filter((collection) => collection.userId === author.id)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map(toCollectionSummary),
  };
}

export function getUserCollectionByUsername(username: string, collectionId: string, viewerUserId?: number) {
  const author = getStoryAuthorByUsername(username);
  const collection = db.collections.find((item) => item.id === collectionId);

  if (!author || !collection || collection.userId !== author.id) {
    return null;
  }

  return {
    collection: toCollectionDetail(collection, viewerUserId),
  };
}

export function listReaderShelf(userId: number, shelf?: ReaderShelf | null) {
  return {
    items: db.shelves
      .filter((entry) => entry.userId === userId && (!shelf || entry.shelf === shelf))
      .map((entry) => {
        const story = db.stories.find((item) => item.id === entry.storyId);

        return story
          ? {
              storyId: entry.storyId,
              shelf: entry.shelf,
              updatedAt: entry.updatedAt,
              story: toStoryListItem(story, userId),
            }
          : null;
      })
      .filter(Boolean),
  };
}

export function setReaderShelf(userId: number, storyId: string, shelf: ReaderShelf) {
  const story = db.stories.find((item) => item.id === storyId && item.status === "published");

  if (!story) {
    return false;
  }

  const existing = db.shelves.find((entry) => entry.userId === userId && entry.storyId === storyId);
  const timestamp = nowIso();

  if (existing) {
    existing.shelf = shelf;
    existing.updatedAt = timestamp;
  } else {
    db.shelves.push({ userId, storyId, shelf, updatedAt: timestamp });
  }

  return true;
}

export function removeReaderShelf(userId: number, storyId: string) {
  db.shelves = db.shelves.filter((entry) => !(entry.userId === userId && entry.storyId === storyId));
}

export function listMyCollections(userId: number) {
  return {
    items: db.collections
      .filter((collection) => collection.userId === userId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map(toCollectionSummary),
  };
}

export function getMyCollection(userId: number, collectionId: string) {
  const collection = db.collections.find((item) => item.id === collectionId && item.userId === userId);

  return collection ? { collection: toCollectionDetail(collection, userId) } : null;
}

export function createUserCollection(userId: number, payload: { title?: string; description?: string | null }) {
  const title = payload.title?.trim() ?? "";

  if (!title || title.length > 200) {
    return null;
  }

  const description = payload.description?.trim() ? payload.description.trim() : null;
  const timestamp = nowIso();
  const collection: UserCollectionRecord = {
    id: `collection-${db.collectionSeed}`,
    userId,
    title,
    description,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.collectionSeed += 1;
  db.collections.unshift(collection);

  return { collection };
}

export function updateUserCollection(
  userId: number,
  collectionId: string,
  payload: { title?: string; description?: string | null },
) {
  const collection = db.collections.find((item) => item.id === collectionId && item.userId === userId);

  if (!collection) {
    return null;
  }

  if (payload.title !== undefined) {
    const title = payload.title.trim();

    if (!title || title.length > 200) {
      return null;
    }

    collection.title = title;
  }

  if (payload.description !== undefined) {
    collection.description = payload.description?.trim() ? payload.description.trim() : null;
  }

  collection.updatedAt = nowIso();

  return { collection };
}

export function deleteUserCollection(userId: number, collectionId: string) {
  const before = db.collections.length;

  db.collections = db.collections.filter((item) => !(item.id === collectionId && item.userId === userId));
  db.collectionStories = db.collectionStories.filter((item) => item.collectionId !== collectionId);

  return db.collections.length !== before;
}

export function addStoryToUserCollection(userId: number, collectionId: string, storyId: string) {
  const collection = db.collections.find((item) => item.id === collectionId && item.userId === userId);
  const story = db.stories.find((item) => item.id === storyId && item.status === "published");

  if (!collection || !story) {
    return false;
  }

  if (!db.collectionStories.some((item) => item.collectionId === collectionId && item.storyId === storyId)) {
    db.collectionStories.push({ collectionId, storyId, createdAt: nowIso() });
  }

  collection.updatedAt = nowIso();

  return true;
}

export function removeStoryFromUserCollection(userId: number, collectionId: string, storyId: string) {
  const collection = db.collections.find((item) => item.id === collectionId && item.userId === userId);

  if (!collection) {
    return false;
  }

  db.collectionStories = db.collectionStories.filter(
    (item) => !(item.collectionId === collectionId && item.storyId === storyId),
  );
  collection.updatedAt = nowIso();

  return true;
}

export function markChapterViewed(chapterId: string, userId?: number) {
  if (!userId || !db.chapters.some((chapter) => chapter.id === chapterId)) {
    return;
  }

  if (!db.chapterViews.some((view) => view.chapterId === chapterId && view.userId === userId)) {
    db.chapterViews.push({ chapterId, userId, createdAt: nowIso() });
  }
}

export function isChapterViewed(chapterId: string, userId?: number) {
  return Boolean(userId && db.chapterViews.some((view) => view.chapterId === chapterId && view.userId === userId));
}

export function listStoryChaptersViewed(slug: string, userId?: number) {
  const story = db.stories.find((item) => item.slug === slug);

  if (!story) {
    return null;
  }

  return {
    items: getChaptersForStory(story.id)
      .filter(isChapterPublishedMock)
      .map((chapter) => ({
        chapterId: chapter.id,
        title: chapter.title,
        viewed: isChapterViewed(chapter.id, userId),
      })),
  };
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function uniqueStorySlug(base: string, currentStoryId?: string) {
  const initial = createSlug(base) || `story-${db.storySeed}`;
  let candidate = initial;
  let suffix = 2;

  while (db.stories.some((story) => story.slug === candidate && story.id !== currentStoryId)) {
    candidate = `${initial}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function countWords(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function buildStoriesQueryResult(query: StoriesQuery): StoriesResponse {
  const filtered = db.stories
    .filter((story) => story.status === "published")
    .filter((story) => (query.q ? story.title.toLowerCase().includes(query.q.toLowerCase()) : true))
    .filter((story) => matchesStoryTags(story, query.tags))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const start = (query.page - 1) * query.pageSize;
  const paged = filtered.slice(start, start + query.pageSize);

  return {
    items: paged.map(toStoryListItem),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
    },
  };
}

export function listStories(query: StoriesQuery, viewerUserId?: number) {
  const result = buildStoriesQueryResult(query);

  return {
    ...result,
    items: result.items.map((item) => {
      const story = db.stories.find((current) => current.id === item.id);

      return story ? toStoryListItem(story, viewerUserId) : item;
    }),
  };
}

export function listMyStories(query: StoriesQuery, viewerUserId?: number) {
  if (!viewerUserId) {
    return {
      items: [],
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: 0,
      },
    } satisfies StoriesResponse;
  }

  const filtered = db.stories
    .filter((story) => story.authorId === viewerUserId)
    .filter((story) => (query.q ? story.title.toLowerCase().includes(query.q.toLowerCase()) : true))
    .filter((story) => matchesStoryTags(story, query.tags))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const start = (query.page - 1) * query.pageSize;
  const paged = filtered.slice(start, start + query.pageSize);

  return {
    items: paged.map((story) => toStoryListItem(story, viewerUserId)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
    },
  };
}

function matchesStoryTags(story: StoryRecord, selectedTags: string[]) {
  const requiredTags: string[] = [];
  const groupedAnyTags = new Map<string, string[]>();

  selectedTags.forEach((tagSlug) => {
    const category = storyTagCategoryBySlug.get(tagSlug);

    if (category && multiMatchAnyCategories.has(category)) {
      const current = groupedAnyTags.get(category) ?? [];
      current.push(tagSlug);
      groupedAnyTags.set(category, current);
      return;
    }

    requiredTags.push(tagSlug);
  });

  return (
    requiredTags.every((tagSlug) => storyMatchesTag(story, tagSlug)) &&
    [...groupedAnyTags.values()].every((tagGroup) => tagGroup.some((tagSlug) => storyMatchesTag(story, tagSlug)))
  );
}

function storyMatchesTag(story: StoryRecord, tagSlug: string) {
  if (story.tagSlugs.includes(tagSlug)) {
    return true;
  }

  const tag = tagMap.get(tagSlug);

  if (!tag) {
    return false;
  }

  switch (tag.category) {
    case "directionality":
      return normalizeTagLabel(story.fandom) === normalizeTagLabel(tag.name);
    case "rating":
      return normalizeTagLabel(story.ratingLabel) === normalizeTagLabel(tag.name);
    case "completion":
      return normalizeTagLabel(story.statusLabel) === normalizeTagLabel(tag.name);
    case "size":
      return normalizeTagLabel(story.sizeLabel) === normalizeTagLabel(tag.name);
    default:
      return false;
  }
}

export function listTags() {
  return {
    items: storyTags,
  };
}

export function getStoryBySlug(slug: string, viewerUserId?: number) {
  const story = db.stories.find((item) => item.slug === slug);

  if (!story) {
    return null;
  }

  if (story.status !== "published" && viewerUserId !== story.authorId) {
    return null;
  }

  return toStoryDetails(story, viewerUserId);
}

export function getChapterById(chapterId: string) {
  const chapter = db.chapters.find((item) => item.id === chapterId);

  return chapter ? toChapterDetails(chapter) : null;
}

export function createStoryRecord(_payload: CreateStoryPayload) {
  throw new Error("createStoryRecord requires authorId. Use createStoryRecordForAuthor instead.");
}

export function createStoryRecordForAuthor(payload: CreateStoryPayload, authorId: number) {
  const timestamp = nowIso();
  const story: StoryRecord = {
    id: `story-${db.storySeed}`,
    slug: uniqueStorySlug(payload.title),
    title: payload.title,
    authorId,
    description: "",
    status: "draft",
    tagSlugs: resolveTagSlugsFromPayload(payload),
    createdAt: timestamp,
    updatedAt: timestamp,
    fandom: "Гарри Поттер",
    pairing: "Не указан",
    ratingLabel: "PG-13",
    statusLabel: "в процессе",
    sizeLabel: "мини",
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    viewsCount: 0,
    likedByUserIds: [],
    aiHint: "AI автора: орфография ещё не запускалась",
    summaryLabel: "Кратко по сюжету",
    readLabel: "Открыть",
    updatedLabel: "только что создано",
  };

  db.storySeed += 1;
  db.stories.unshift(story);

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    status: story.status,
    authorId: story.authorId,
    aiHint: story.aiHint,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
}

export function updateStoryRecord(storyId: string, payload: UpdateStoryPayload) {
  const story = db.stories.find((item) => item.id === storyId);

  if (!story) {
    return null;
  }

  if (payload.title && payload.title !== story.title) {
    story.title = payload.title;
    story.slug = uniqueStorySlug(payload.title, story.id);
  }
  if (payload.tagIds) {
    story.tagSlugs = resolveTagSlugsFromPayload(payload);
  }
  story.updatedAt = nowIso();
  story.updatedLabel = "обновлено только что";

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    status: story.status,
    authorId: story.authorId,
    aiHint: story.aiHint,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
}

export function deleteStoryRecord(storyId: string) {
  const storyIndex = db.stories.findIndex((item) => item.id === storyId);

  if (storyIndex === -1) {
    return false;
  }

  const chapterIds = db.chapters.filter((chapter) => chapter.storyId === storyId).map((chapter) => chapter.id);

  db.stories.splice(storyIndex, 1);
  db.comments = db.comments.filter((comment) => !chapterIds.includes(comment.chapterId));
  db.chapters = db.chapters.filter((chapter) => chapter.storyId !== storyId);
  db.shelves = db.shelves.filter((entry) => entry.storyId !== storyId);
  db.collectionStories = db.collectionStories.filter((entry) => entry.storyId !== storyId);
  db.chapterViews = db.chapterViews.filter((entry) => !chapterIds.includes(entry.chapterId));
  db.aiJobs = db.aiJobs.filter((job) => db.chapters.some((chapter) => chapter.id === job.chapterId));

  return true;
}

function toStoryComment(comment: CommentRecord, viewerUserId?: number): StoryComment {
  const chapter = db.chapters.find((item) => item.id === comment.chapterId);
  const storyId = chapter?.storyId ?? "";

  return {
    id: comment.id,
    storyId,
    chapterId: comment.chapterId,
    author: {
      id: comment.authorId,
      username: comment.authorUsername,
      email: comment.authorEmail,
      avatarUrl: storyAuthors[comment.authorId]?.avatarUrl ?? null,
    },
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    viewerCanDelete: Boolean(viewerUserId && viewerUserId === comment.authorId),
  };
}

export function getStoryComments(storyId: string, viewerUserId?: number) {
  const chapterIds = db.chapters.filter((chapter) => chapter.storyId === storyId).map((chapter) => chapter.id);

  return db.comments
    .filter((comment) => chapterIds.includes(comment.chapterId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((comment) => toStoryComment(comment, viewerUserId));
}

export function getChapterComments(chapterId: string, viewerUserId?: number) {
  return db.comments
    .filter((comment) => comment.chapterId === chapterId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((comment) => toStoryComment(comment, viewerUserId));
}

export function addChapterCommentRecord(chapterId: string, payload: CreateStoryCommentPayload, user: AuthUser) {
  const chapter = db.chapters.find((item) => item.id === chapterId);
  const story = chapter ? db.stories.find((item) => item.id === chapter.storyId) : undefined;
  const content = payload.content.trim();

  if (!chapter || !story || !content) {
    return null;
  }

  const timestamp = nowIso();
  const comment: CommentRecord = {
    id: `comment-${db.commentSeed}`,
    chapterId,
    authorId: user.id,
    authorUsername: user.username,
    authorEmail: user.email,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.commentSeed += 1;
  db.comments.unshift(comment);
  story.commentsCount += 1;

  return toStoryComment(comment, user.id);
}

export function deleteStoryCommentRecord(commentId: string, viewerUserId: number) {
  const commentIndex = db.comments.findIndex((comment) => comment.id === commentId && comment.authorId === viewerUserId);

  if (commentIndex === -1) {
    return false;
  }

  const [removed] = db.comments.splice(commentIndex, 1);
  const chapter = db.chapters.find((item) => item.id === removed.chapterId);
  const story = chapter ? db.stories.find((item) => item.id === chapter.storyId) : undefined;

  if (story && story.commentsCount > 0) {
    story.commentsCount -= 1;
  }

  return true;
}

function toToggleLikeResult(story: StoryRecord, viewerUserId: number): ToggleLikeResult {
  const liked = story.likedByUserIds.includes(viewerUserId);

  return {
    storyId: story.id,
    likesCount: story.likesCount,
    viewerHasLiked: liked,
  };
}

export function likeStoryRecord(storyId: string, viewerUserId: number) {
  const story = db.stories.find((item) => item.id === storyId);

  if (!story) {
    return null;
  }

  if (!story.likedByUserIds.includes(viewerUserId)) {
    story.likedByUserIds.push(viewerUserId);
    story.likesCount += 1;
  }

  return toToggleLikeResult(story, viewerUserId);
}

export function unlikeStoryRecord(storyId: string, viewerUserId: number) {
  const story = db.stories.find((item) => item.id === storyId);

  if (!story) {
    return null;
  }

  if (story.likedByUserIds.includes(viewerUserId)) {
    story.likedByUserIds = story.likedByUserIds.filter((id) => id !== viewerUserId);
    if (story.likesCount > 0) {
      story.likesCount -= 1;
    }
  }

  return toToggleLikeResult(story, viewerUserId);
}

export function createChapterRecord(storyId: string, payload: CreateChapterPayload) {
  const story = db.stories.find((item) => item.id === storyId);

  if (!story) {
    return null;
  }

  const nextNumber = getChaptersForStory(storyId).at(-1)?.number ?? 0;
  const timestamp = nowIso();
  const chapter: ChapterRecord = {
    id: `chapter-${db.chapterSeed}`,
    storyId,
    number: nextNumber + 1,
    title: payload.title,
    content: payload.content,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.chapterSeed += 1;
  db.chapters.push(chapter);
  story.updatedAt = timestamp;
  story.updatedLabel = "обновлено только что";

  return toChapterDetails(chapter);
}

export function updateChapterRecord(chapterId: string, payload: UpdateChapterPayload) {
  const chapter = db.chapters.find((item) => item.id === chapterId);

  if (!chapter) {
    return null;
  }

  chapter.title = payload.title;
  chapter.content = payload.content;
  chapter.updatedAt = nowIso();

  const story = db.stories.find((item) => item.id === chapter.storyId);

  if (story) {
    story.updatedAt = chapter.updatedAt;
    story.updatedLabel = "обновлено только что";
  }

  return toChapterDetails(chapter);
}

export function deleteChapterRecord(chapterId: string) {
  const chapterIndex = db.chapters.findIndex((item) => item.id === chapterId);

  if (chapterIndex === -1) {
    return false;
  }

  const chapter = db.chapters[chapterIndex];

  db.chapters.splice(chapterIndex, 1);
  db.aiJobs = db.aiJobs.filter((job) => job.chapterId !== chapterId);
  db.chapterViews = db.chapterViews.filter((view) => view.chapterId !== chapterId);

  const story = db.stories.find((item) => item.id === chapter.storyId);

  if (story) {
    story.updatedAt = nowIso();
    story.updatedLabel = "обновлено только что";
  }

  return true;
}

function isChapterPublishedMock(chapter: ChapterRecord) {
  return chapter.status !== "draft";
}

export function publishChapterRecord(chapterId: string) {
  const chapter = db.chapters.find((item) => item.id === chapterId);

  if (!chapter) {
    return null;
  }

  if (isChapterPublishedMock(chapter)) {
    return { status: "published" as const };
  }

  chapter.status = "published";
  chapter.updatedAt = nowIso();

  const story = db.stories.find((item) => item.id === chapter.storyId);

  if (story) {
    story.status = "published";
    story.updatedAt = chapter.updatedAt;
    story.updatedLabel = "опубликовано только что";

    const publishedForStory = getChaptersForStory(story.id).filter((ch) => isChapterPublishedMock(ch));

    if (publishedForStory.length === 1 && !story.description.trim()) {
      const excerpt = chapter.content.trim().slice(0, 280);
      story.description = excerpt.length < chapter.content.trim().length ? `${excerpt}…` : excerpt;
    }
  }

  return { status: "published" as const };
}

function createSpellcheckResult(payload: SpellcheckPayload): SpellcheckResult {
  const issues: SpellcheckIssue[] = [];
  const rules = [
    { wrong: "нечаяно", suggestion: "нечаянно", message: "Возможная орфографическая ошибка" },
    { wrong: "вообщем", suggestion: "в общем", message: "Слитное написание выглядит ошибочным" },
    { wrong: "какбудто", suggestion: "как будто", message: "Слово стоит писать раздельно" },
  ];

  rules.forEach((rule) => {
    const index = payload.content.toLowerCase().indexOf(rule.wrong);

    if (index >= 0) {
      issues.push({
        fragmentText: payload.content.slice(index, index + rule.wrong.length),
        startOffset: index,
        endOffset: index + rule.wrong.length,
        message: rule.message,
        suggestion: rule.suggestion,
      });
    }
  });

  return {
    summary: issues.length
      ? `Найдено ${issues.length} замечани${issues.length === 1 ? "е" : "я"}`
      : "Явных орфографических ошибок не найдено",
    items: issues,
  };
}

function createLogicCheckResult(payload: SpellcheckPayload): LogicCheckResult {
  const lower = payload.content.toLowerCase();

  if (lower.includes("противореч") || lower.includes("дважды умер")) {
    return {
      message:
        "Возможная логическая нестыковка: перепроверьте факты относительно опубликованных глав и лора.",
    };
  }

  return {
    message: "Логических нестыковок не найдено.",
  };
}

function createChapterImage(prompt: string, title: string) {
  const accent = ["#36513f", "#bc5f3d", "#253349", "#7f5a3b"][db.imageSeed % 4];
  const safePrompt = encodeURIComponent(prompt.slice(0, 80));
  const safeTitle = encodeURIComponent(title.slice(0, 48));

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'%3E%3Crect width='100%25' height='100%25' fill='${encodeURIComponent(
    accent,
  )}'/%3E%3Ccircle cx='790' cy='240' r='148' fill='%23f7f2ea' fill-opacity='.18'/%3E%3Ctext x='72' y='156' fill='%23f7f2ea' font-size='48' font-family='Georgia'%3E${safeTitle}%3C/text%3E%3Ctext x='72' y='244' fill='%23f0e8db' font-size='28' font-family='Arial'%3E${safePrompt}%3C/text%3E%3C/svg%3E`;
}

function createImageResult(payload: ImageGenerationPayload): ImageGenerationResult {
  const chapter = db.chapters.find((item) => item.id === payload.chapterId);

  if (!chapter) {
    return { images: [] };
  }

  const imageUrl = createChapterImage(payload.prompt, chapter.title);
  const image: GeneratedImage = {
    id: `image-${db.imageSeed}`,
    imageUrl,
    prompt: payload.prompt,
  };

  db.imageSeed += 1;
  chapter.imageUrl = image.imageUrl;
  chapter.imagePrompt = payload.prompt;
  chapter.updatedAt = nowIso();

  const story = db.stories.find((item) => item.id === chapter.storyId);

  if (story) {
    story.updatedAt = chapter.updatedAt;
    story.updatedLabel = "обновлено только что";
  }

  return { images: [image] };
}

function getOrCompleteJob(job: AiJobRecord) {
  if ((job.status === "queued" || job.status === "processing") && Date.now() >= job.readyAt) {
    job.status = "completed";

    if (job.type === "spellcheck") {
      job.result = createSpellcheckResult(job.payload as SpellcheckPayload);
    }

    if (job.type === "logic_check") {
      job.result = createLogicCheckResult(job.payload as SpellcheckPayload);
    }

    if (job.type === "image_generation") {
      job.result = createImageResult(job.payload as ImageGenerationPayload);
    }
  }

  return job;
}

export function createSpellcheckJob(payload: SpellcheckPayload): AiJobAccepted {
  const jobId = `job-${db.jobSeed}`;
  db.jobSeed += 1;
  db.aiJobs.push({
    id: jobId,
    type: "spellcheck",
    chapterId: payload.chapterId,
    status: "queued",
    createdAt: Date.now(),
    readyAt: Date.now() + 250,
    payload,
  });

  return {
    jobId,
    status: "queued",
  };
}

export function createLogicCheckJob(payload: SpellcheckPayload): AiJobAccepted {
  const jobId = `job-${db.jobSeed}`;
  db.jobSeed += 1;
  db.aiJobs.push({
    id: jobId,
    type: "logic_check",
    chapterId: payload.chapterId,
    status: "queued",
    createdAt: Date.now(),
    readyAt: Date.now() + 280,
    payload,
  });

  return {
    jobId,
    status: "queued",
  };
}

export function createImageGenerationJob(payload: ImageGenerationPayload): AiJobAccepted {
  const jobId = `job-${db.jobSeed}`;
  db.jobSeed += 1;
  db.aiJobs.push({
    id: jobId,
    type: "image_generation",
    chapterId: payload.chapterId,
    status: "queued",
    createdAt: Date.now(),
    readyAt: Date.now() + 300,
    payload,
  });

  return {
    jobId,
    status: "queued",
  };
}

export function getAiJob(jobId: string) {
  const job = db.aiJobs.find((item) => item.id === jobId);

  if (!job) {
    return null;
  }

  const current = getOrCompleteJob(job);

  return {
    jobId: current.id,
    type: current.type,
    status: current.status,
    result: current.result,
    errorMessage: current.errorMessage,
  };
}
