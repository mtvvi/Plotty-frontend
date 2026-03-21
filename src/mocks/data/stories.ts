import { storyTags } from "@/shared/config/story-tags";

import type {
  AiJobAccepted,
  AiJobStatus,
  AiJobType,
  ChapterDetails,
  ChapterListItem,
  CreateChapterPayload,
  CreateStoryPayload,
  GeneratedImage,
  ImageGenerationPayload,
  ImageGenerationResult,
  SpellcheckIssue,
  SpellcheckPayload,
  SpellcheckResult,
  StoriesQuery,
  StoriesResponse,
  StoryDetails,
  StoryListItem,
  StoryStatus,
  StoryTag,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "@/entities/story/model/types";

interface StoryRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  status: StoryStatus;
  tagSlugs: string[];
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
  aiJobs: AiJobRecord[];
  jobSeed: number;
  storySeed: number;
  chapterSeed: number;
  imageSeed: number;
}

const tagMap = new Map(storyTags.map((tag) => [tag.slug, tag]));

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
          "Восьмой курс начинается как вынужденное перемирие, но найденный архив меняет правила игры и личные границы.",
        status: "published",
        tagSlugs: ["slow-burn", "canon-divergence", "angst"],
        createdAt: "2026-03-19T18:00:00.000Z",
        updatedAt: "2026-03-21T10:10:00.000Z",
      },
      {
        id: "story-2",
        slug: "ashes-and-salt",
        title: "Пепел и соль",
        description:
          "Йеннифэр и Геральт снова идут по следу пропавшей карты, которая ведет к старому долгу и новым решениям.",
        excerpt:
          "Новая охота начинается с пропавшей карты, а заканчивается там, где у героев давно не осталось честных ответов.",
        status: "published",
        tagSlugs: ["post-canon", "romance", "mystery"],
        createdAt: "2026-03-18T14:00:00.000Z",
        updatedAt: "2026-03-20T11:45:00.000Z",
      },
      {
        id: "story-3",
        slug: "yellow-corridor",
        title: "Жёлтый коридор",
        description:
          "История о маленькой гостинице, старом письме и странном коридоре, где каждое решение будто уже было принято.",
        excerpt:
          "Одна гостиница, одно письмо и коридор, в котором прошлое разговаривает слишком убедительно.",
        status: "draft",
        tagSlugs: ["hurt-comfort", "mystery"],
        createdAt: "2026-03-20T09:30:00.000Z",
        updatedAt: "2026-03-21T08:25:00.000Z",
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
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540'%3E%3Crect width='100%25' height='100%25' fill='%23253349'/%3E%3Ctext x='56' y='140' fill='%23f7f2ea' font-size='44' font-family='Georgia'%3EПосле полуночи снег не тает%3C/text%3E%3Ctext x='56' y='220' fill='%23d9d2c4' font-size='28' font-family='Arial'%3EАрхив под лестницей%3C/text%3E%3C/svg%3E",
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
        title: "Глава 1. Номер без вида",
        content:
          "В гостинице не было окон на север, но сквозняк все равно шел именно оттуда. Хозяйка сказала, что это привычка дома, как будто дома тоже бывают упрямыми.",
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-21T08:25:00.000Z",
      },
    ],
    aiJobs: [],
    jobSeed: 1,
    storySeed: 4,
    chapterSeed: 5,
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
    wordCount: countWords(chapter.content),
    updatedAt: chapter.updatedAt,
    hasImage: Boolean(chapter.imageUrl),
    imageUrl: chapter.imageUrl,
  };
}

function toStoryListItem(story: StoryRecord): StoryListItem {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    description: story.description,
    excerpt: story.excerpt,
    status: story.status,
    tags: resolveTags(story.tagSlugs),
    chaptersCount: getChaptersForStory(story.id).length,
    updatedAt: story.updatedAt,
  };
}

function toStoryDetails(story: StoryRecord): StoryDetails {
  return {
    ...toStoryListItem(story),
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
    .filter((story) => query.tags.every((tag) => story.tagSlugs.includes(tag)))
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

export function listStories(query: StoriesQuery) {
  return buildStoriesQueryResult(query);
}

export function getStoryBySlug(slug: string) {
  const story = db.stories.find((item) => item.slug === slug);

  return story ? toStoryDetails(story) : null;
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
    description: payload.description,
    excerpt: payload.excerpt,
    status: "draft",
    tagSlugs: payload.tags,
    createdAt: timestamp,
    updatedAt: timestamp,
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

  story.title = payload.title;
  story.description = payload.description;
  story.excerpt = payload.excerpt;
  story.tagSlugs = payload.tags;
  story.slug = uniqueStorySlug(payload.title, story.id);
  story.updatedAt = nowIso();

  return toStoryDetails(story);
}

export function deleteStoryRecord(storyId: string) {
  const storyIndex = db.stories.findIndex((item) => item.id === storyId);

  if (storyIndex === -1) {
    return false;
  }

  db.stories.splice(storyIndex, 1);
  db.chapters = db.chapters.filter((chapter) => chapter.storyId !== storyId);
  db.aiJobs = db.aiJobs.filter((job) => {
    const chapter = db.chapters.find((item) => item.id === job.chapterId);

    return Boolean(chapter);
  });

  return true;
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

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540'%3E%3Crect width='100%25' height='100%25' fill='${encodeURIComponent(
    accent,
  )}'/%3E%3Ccircle cx='760' cy='120' r='92' fill='%23f7f2ea' fill-opacity='.18'/%3E%3Ctext x='56' y='120' fill='%23f7f2ea' font-size='42' font-family='Georgia'%3E${safeTitle}%3C/text%3E%3Ctext x='56' y='204' fill='%23f0e8db' font-size='26' font-family='Arial'%3E${safePrompt}%3C/text%3E%3C/svg%3E`;
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
