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
  SpellcheckIssue,
  SpellcheckPayload,
  SpellcheckResult,
  StoryComment,
  StoriesQuery,
  StoriesResponse,
  StoryDetails,
  StoryListItem,
  StoryStatus,
  StoryTag,
  ToggleLikeResult,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "@/entities/story/model/types";
import type { AuthUser } from "@/entities/auth/model/types";

interface StoryRecord {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string;
  description: string;
  excerpt: string;
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
  storyId: string;
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
  result?: SpellcheckResult | ImageGenerationResult;
  errorMessage?: string;
}

interface MockStoriesDb {
  stories: StoryRecord[];
  chapters: ChapterRecord[];
  comments: CommentRecord[];
  aiJobs: AiJobRecord[];
  jobSeed: number;
  storySeed: number;
  chapterSeed: number;
  commentSeed: number;
  imageSeed: number;
}

const tagMap = new Map(storyTags.map((tag) => [tag.slug, tag]));
const multiMatchAnyCategories = new Set(["rating", "completion", "size"]);
const storyTagCategoryBySlug = new Map(storyTags.map((tag) => [tag.slug, tag.category ?? "other"]));

function normalizeTagLabel(value: string) {
  return value.trim().toLowerCase();
}

function resolveTagSlugsFromPayload(payload: { tags?: string[]; tagIds?: string[] }) {
  if (payload.tags?.length) {
    return payload.tags;
  }

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
        description:
          "Гермиона пытается пережить восьмой курс, пока архив старого факультета вскрывает неудобные связи между прошлым и настоящим.",
        excerpt:
          "Восьмой курс начинается как вынужденное перемирие, но каждое письмо из архива Хогвартса поднимает старые долги. История тянется медленно, через библиотеку, снег и слишком внятные паузы в диалогах.",
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
        description:
          "Йеннифэр и Геральт снова идут по следу пропавшей карты, которая ведет к старому долгу и новым решениям.",
        excerpt:
          "После охоты на стрыгу Геральт едет не туда, куда собирался, и весь маршрут превращается в спор о том, кто кому семья, если никто не умеет это произносить вслух.",
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
        description:
          "Детективная линия в Средиземье, где почти каждый разговор одновременно допрос и попытка защитить близкого человека.",
        excerpt:
          "Минас-Тирит, утро, протокол, разбитые витрины. Следствие тянется через коридоры власти, где любой неверный шаг звучит громче меча.",
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
        description:
          "Эпистолярная история о доверии, памяти и аккуратно спрятанных чувствах в мире Гарри Поттера.",
        excerpt:
          "Текст держится на письмах, в которых важнее не сказанное, а то, как меняется тон между строками. Автор явно работает на длинную дистанцию и аккуратно собирает доверие из мелочей.",
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
        description:
          "История о деревне скрытого листа, где официальные поручения и личная верность постоянно ломают друг друга.",
        excerpt:
          "Каждая миссия выглядит как формальность, пока не становится ясно, что приказ и привязанность ведут героев в разные стороны.",
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
        storyId: "story-1",
        authorId: 101,
        authorUsername: "reader_one",
        authorEmail: "reader_one@plotty.test",
        content: "Очень хорошо держится ритм. Хочется быстрее открыть следующую главу.",
        createdAt: "2026-03-21T08:40:00.000Z",
        updatedAt: "2026-03-21T08:40:00.000Z",
      },
      {
        id: "comment-2",
        storyId: "story-1",
        authorId: 102,
        authorUsername: "snowowl",
        authorEmail: "snowowl@plotty.test",
        content: "Архив и снег работают отлично. Было бы интересно больше напряжения в сцене у двери.",
        createdAt: "2026-03-21T09:12:00.000Z",
        updatedAt: "2026-03-21T09:12:00.000Z",
      },
    ],
    aiJobs: [],
    jobSeed: 1,
    storySeed: 6,
    chapterSeed: 7,
    commentSeed: 3,
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

function getStoryCoverImage(story: StoryRecord) {
  return story.coverImageUrl ?? getChaptersForStory(story.id).find((chapter) => chapter.imageUrl)?.imageUrl;
}

function toChapterListItem(chapter: ChapterRecord): ChapterListItem {
  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    wordCount: countWords(chapter.content),
    updatedAt: chapter.updatedAt,
    hasImage: Boolean(chapter.imageUrl),
    imageUrl: chapter.imageUrl,
  };
}

function toStoryListItem(story: StoryRecord, viewerUserId?: number): StoryListItem {
  const firstChapter = getChaptersForStory(story.id)[0];

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    coverImageUrl: getStoryCoverImage(story),
    firstChapterId: firstChapter?.id,
    createdAt: story.createdAt,
    description: story.description,
    excerpt: story.excerpt,
    status: story.status,
    tags: resolveTags(story.tagSlugs),
    chaptersCount: getChaptersForStory(story.id).length,
    updatedAt: story.updatedAt,
    fandom: story.fandom,
    pairing: story.pairing,
    ratingLabel: story.ratingLabel,
    statusLabel: story.statusLabel,
    sizeLabel: story.sizeLabel,
    likesCount: story.likesCount,
    commentsCount: story.commentsCount,
    bookmarksCount: story.bookmarksCount,
    viewsCount: story.viewsCount,
    viewerHasLiked: viewerUserId ? story.likedByUserIds.includes(viewerUserId) : false,
    aiHint: story.aiHint,
    summaryLabel: story.summaryLabel,
    readLabel: story.readLabel,
    updatedLabel: story.updatedLabel,
  };
}

function toStoryDetails(story: StoryRecord, viewerUserId?: number): StoryDetails {
  return {
    ...toStoryListItem(story, viewerUserId),
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    chapters: getChaptersForStory(story.id).map(toChapterListItem),
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
    storyDescription: story.description,
    storyExcerpt: story.excerpt,
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

  return story ? toStoryDetails(story, viewerUserId) : null;
}

export function getChapterById(chapterId: string) {
  const chapter = db.chapters.find((item) => item.id === chapterId);

  return chapter ? toChapterDetails(chapter) : null;
}

export function createStoryRecord(payload: CreateStoryPayload) {
  const timestamp = nowIso();
  const story: StoryRecord = {
    id: `story-${db.storySeed}`,
    slug: uniqueStorySlug(payload.title),
    title: payload.title,
    description: payload.description ?? "",
    excerpt: payload.excerpt ?? "",
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

  return toStoryDetails(story);
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
  story.description = payload.description ?? story.description;
  story.excerpt = payload.excerpt ?? story.excerpt;
  if (payload.tags || payload.tagIds) {
    story.tagSlugs = resolveTagSlugsFromPayload(payload);
  }
  story.updatedAt = nowIso();
  story.updatedLabel = "обновлено только что";

  return toStoryDetails(story);
}

export function deleteStoryRecord(storyId: string) {
  const storyIndex = db.stories.findIndex((item) => item.id === storyId);

  if (storyIndex === -1) {
    return false;
  }

  db.stories.splice(storyIndex, 1);
  db.chapters = db.chapters.filter((chapter) => chapter.storyId !== storyId);
  db.comments = db.comments.filter((comment) => comment.storyId !== storyId);
  db.aiJobs = db.aiJobs.filter((job) => db.chapters.some((chapter) => chapter.id === job.chapterId));

  return true;
}

function toStoryComment(comment: CommentRecord, viewerUserId?: number): StoryComment {
  return {
    id: comment.id,
    storyId: comment.storyId,
    author: {
      id: comment.authorId,
      username: comment.authorUsername,
      email: comment.authorEmail,
      avatarUrl: null,
    },
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    viewerCanDelete: Boolean(viewerUserId && viewerUserId === comment.authorId),
  };
}

export function getStoryComments(storyId: string, viewerUserId?: number) {
  return db.comments
    .filter((comment) => comment.storyId === storyId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((comment) => toStoryComment(comment, viewerUserId));
}

export function addStoryCommentRecord(storyId: string, payload: CreateStoryCommentPayload, user: AuthUser) {
  const story = db.stories.find((item) => item.id === storyId);
  const content = payload.content.trim();

  if (!story || !content) {
    return null;
  }

  const timestamp = nowIso();
  const comment: CommentRecord = {
    id: `comment-${db.commentSeed}`,
    storyId,
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
  const story = db.stories.find((item) => item.id === removed.storyId);

  if (story && story.commentsCount > 0) {
    story.commentsCount -= 1;
  }

  return true;
}

function toToggleLikeResult(story: StoryRecord, viewerUserId: number): ToggleLikeResult {
  return {
    storyId: story.id,
    likesCount: story.likesCount,
    commentsCount: story.commentsCount,
    bookmarksCount: story.bookmarksCount,
    viewsCount: story.viewsCount,
    viewerHasLiked: story.likedByUserIds.includes(viewerUserId),
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

  const story = db.stories.find((item) => item.id === chapter.storyId);

  if (story) {
    story.updatedAt = nowIso();
    story.updatedLabel = "обновлено только что";
  }

  return true;
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
