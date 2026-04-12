import { http, HttpResponse } from "msw";

import { parseStoriesQuery } from "@/entities/story/model/story-query";
import { isValidUsername } from "@/shared/lib/username";
import type {
  CreateStoryCommentPayload,
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
  deleteStoryCommentRecord,
  deleteChapterRecord,
  deleteStoryRecord,
  getChapterComments,
  getAiJob,
  getChapterById,
  getStoryBySlug,
  likeStoryRecord,
  listTags,
  listStories,
  addChapterCommentRecord,
  unlikeStoryRecord,
  publishChapterRecord,
  updateChapterRecord,
  updateStoryRecord,
} from "./data/stories";
import { getMockSession, loginMockUser, logoutMockUser, registerMockUser, updateMockUserProfile } from "./data/auth";

export const handlers = [
  http.get("*/session", () => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    return HttpResponse.json(session);
  }),

  http.post("*/login", async ({ request }) => {
    const payload = (await request.json()) as { email: string; password: string };
    const session = loginMockUser(payload);

    if (!session) {
      return HttpResponse.json({ error: "invalid email or password" }, { status: 401 });
    }

    return HttpResponse.json(session);
  }),

  http.post("*/register", async ({ request }) => {
    const payload = (await request.json()) as { email: string; password: string; confirm_password: string };

    if (payload.password !== payload.confirm_password) {
      return HttpResponse.json({ error: "passwords do not match" }, { status: 400 });
    }

    const result = registerMockUser(payload);

    if ("error" in result) {
      return HttpResponse.json({ error: result.error }, { status: 400 });
    }

    return HttpResponse.json(result, { status: 201 });
  }),

  http.post("*/logout", () => {
    logoutMockUser();

    return HttpResponse.json({ status: "logged out" });
  }),

  http.patch("*/profile", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as { username?: string; avatarUrl?: string };

    if (payload.username === undefined && payload.avatarUrl === undefined) {
      return HttpResponse.json({ error: "nothing to update" }, { status: 400 });
    }

    const resolvedUsername =
      typeof payload.username === "string" ? payload.username.trim() : session.user.username;

    if (typeof payload.username === "string" && !isValidUsername(resolvedUsername)) {
      return HttpResponse.json(
        { error: "username may only contain Latin letters, digits and underscore" },
        { status: 400 },
      );
    }

    const result = updateMockUserProfile({ username: resolvedUsername });

    if ("error" in result) {
      return HttpResponse.json({ error: result.error }, { status: 401 });
    }

    return HttpResponse.json(result);
  }),

  http.get("*/tags", () => {
    return HttpResponse.json(listTags());
  }),

  http.get("*/stories", ({ request }) => {
    const url = new URL(request.url);
    const query = parseStoriesQuery(url.searchParams);
    const session = getMockSession();

    return HttpResponse.json(listStories(query, session?.user.id));
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
    const session = getMockSession();
    const story = getStoryBySlug(String(params.slug), session?.user.id);

    if (!story) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(story);
  }),

  http.get("*/chapters/:chapterId/comments", ({ request, params }) => {
    const session = getMockSession();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const items = getChapterComments(String(params.chapterId), session?.user.id);

    return HttpResponse.json({
      items,
      pagination: {
        page: page > 0 ? page : 1,
        pageSize: pageSize > 0 ? pageSize : 20,
        total: items.length,
      },
    });
  }),

  http.post("*/chapters/:chapterId/comments", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateStoryCommentPayload;
    const comment = addChapterCommentRecord(String(params.chapterId), payload, session.user);

    if (!comment) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json(comment, { status: 201 });
  }),

  http.delete("*/comments/:commentId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const deleted = deleteStoryCommentRecord(String(params.commentId), session.user.id);

    if (!deleted) {
      return HttpResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    return HttpResponse.json({ ok: true });
  }),

  http.post("*/stories/:storyId/like", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const result = likeStoryRecord(String(params.storyId), session.user.id);

    if (!result) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(result);
  }),

  http.delete("*/stories/:storyId/like", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const result = unlikeStoryRecord(String(params.storyId), session.user.id);

    if (!result) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(result);
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

  http.post("*/chapters/:chapterId/publish", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const result = publishChapterRecord(String(params.chapterId));

    if (!result) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json(result);
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
