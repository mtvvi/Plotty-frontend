import { http, HttpResponse } from "msw";

import { parseStoriesQuery } from "@/entities/story/model/story-query";
import type {
  CreateChapterPayload,
  CreateStoryPayload,
  ImageGenerationPayload,
  SpellcheckPayload,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "@/entities/story/model/types";

import {
  createChapterRecord,
  createImageGenerationJob,
  createSpellcheckJob,
  createStoryRecord,
  deleteChapterRecord,
  deleteStoryRecord,
  getAiJob,
  getChapterById,
  getStoryBySlug,
  listStories,
  updateChapterRecord,
  updateStoryRecord,
} from "./data/stories";

export const handlers = [
  http.get("*/stories", ({ request }) => {
    const url = new URL(request.url);
    const query = parseStoriesQuery(url.searchParams);

    return HttpResponse.json(listStories(query));
  }),

  http.post("*/stories", async ({ request }) => {
    const payload = (await request.json()) as CreateStoryPayload;

    return HttpResponse.json(createStoryRecord(payload), { status: 201 });
  }),

  http.patch("*/stories/:storyId", async ({ params, request }) => {
    const payload = (await request.json()) as UpdateStoryPayload;
    const story = updateStoryRecord(String(params.storyId), payload);

    if (!story) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(story);
  }),

  http.delete("*/stories/:storyId", ({ params }) => {
    const deleted = deleteStoryRecord(String(params.storyId));

    if (!deleted) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json({ ok: true });
  }),

  http.get("*/stories/:slug", ({ params }) => {
    const story = getStoryBySlug(String(params.slug));

    if (!story) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(story);
  }),

  http.post("*/stories/:storyId/chapters", async ({ params, request }) => {
    const payload = (await request.json()) as CreateChapterPayload;
    const chapter = createChapterRecord(String(params.storyId), payload);

    if (!chapter) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(chapter, { status: 201 });
  }),

  http.patch("*/chapters/:chapterId", async ({ params, request }) => {
    const payload = (await request.json()) as UpdateChapterPayload;
    const chapter = updateChapterRecord(String(params.chapterId), payload);

    if (!chapter) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json(chapter);
  }),

  http.delete("*/chapters/:chapterId", ({ params }) => {
    const deleted = deleteChapterRecord(String(params.chapterId));

    if (!deleted) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json({ ok: true });
  }),

  http.get("*/chapters/:chapterId", ({ params }) => {
    const chapter = getChapterById(String(params.chapterId));

    if (!chapter) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json(chapter);
  }),

  http.post("*/ai/spellcheck", async ({ request }) => {
    const payload = (await request.json()) as SpellcheckPayload;

    return HttpResponse.json(createSpellcheckJob(payload), { status: 202 });
  }),

  http.post("*/ai/image-generation", async ({ request }) => {
    const payload = (await request.json()) as ImageGenerationPayload;

    return HttpResponse.json(createImageGenerationJob(payload), { status: 202 });
  }),

  http.get("*/ai/jobs/:jobId", ({ params }) => {
    const job = getAiJob(String(params.jobId));

    if (!job) {
      return HttpResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return HttpResponse.json(job);
  }),
];
