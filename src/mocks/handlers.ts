import { http, HttpResponse, passthrough } from "msw";

import { parseStoriesQuery } from "@/entities/story/model/story-query";
import type { ReaderShelf } from "@/entities/library/model/types";
import { AI_CREDIT_COSTS } from "@/entities/credits/model/credit-utils";
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
  createCanonCheckJob,
  createImageGenerationJob,
  createLogicCheckJob,
  createSpellcheckJob,
  createStoryRecordForAuthor,
  createUserCollection,
  deleteStoryCommentRecord,
  deleteChapterRecord,
  deleteStoryRecord,
  deleteUserCollection,
  deductMockCredits,
  getCreditBalance,
  getPublicProfile,
  getChapterComments,
  getAiJob,
  getChapterById,
  getStoryBySlug,
  getMyCollection,
  getUserCollectionByUsername,
  isChapterViewed,
  getCreditPurchaseUrl,
  likeStoryRecord,
  listCreditPackages,
  listCreditTransactions,
  listMyCollections,
  listPublicStoriesByUsername,
  listReaderShelf,
  listStoryChaptersViewed,
  listTags,
  listStories,
  listMyStories,
  listUserCollectionsByUsername,
  markChapterViewed,
  removeReaderShelf,
  removeStoryFromUserCollection,
  addChapterCommentRecord,
  addStoryToUserCollection,
  approveSuggestedFandom,
  createSuggestedFandom,
  setReaderShelf,
  listPendingSuggestedFandoms,
  rejectSuggestedFandom,
  unlikeStoryRecord,
  publishChapterRecord,
  updateChapterRecord,
  updateStoryCommentRecord,
  updateStoryRecord,
  updateUserCollection,
} from "./data/stories";
import { getMockSession, loginMockUser, logoutMockUser, registerMockUser, updateMockUserProfile } from "./data/auth";

function passthroughAppRouteRequest(request: Request) {
  const url = new URL(request.url);

  return !url.pathname.startsWith("/api/") && url.searchParams.has("_rsc");
}

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

  http.get("*/credits/balance", () => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    return HttpResponse.json(getCreditBalance(session.user.id));
  }),

  http.get("*/credits/packages", () => {
    return HttpResponse.json(listCreditPackages());
  }),

  http.get("*/credits/transactions", () => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    return HttpResponse.json(listCreditTransactions(session.user.id));
  }),

  http.post("*/credits/purchase", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as { packageId?: number };
    const payUrl = typeof payload.packageId === "number" ? getCreditPurchaseUrl(session.user.id, payload.packageId) : null;

    if (!payUrl) {
      return HttpResponse.json({ error: "not found" }, { status: 404 });
    }

    return HttpResponse.json({ payUrl });
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

  http.get("*/users/:username", ({ params }) => {
    const profile = getPublicProfile(String(params.username));

    if (!profile) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    return HttpResponse.json({ profile });
  }),

  http.get("*/users/:username/stories", ({ request, params }) => {
    const url = new URL(request.url);
    const query = parseStoriesQuery(url.searchParams);
    const session = getMockSession();
    const response = listPublicStoriesByUsername(String(params.username), query, session?.user.id);

    if (!response) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    return HttpResponse.json(response);
  }),

  http.get("*/users/:username/collections", ({ params }) => {
    const response = listUserCollectionsByUsername(String(params.username));

    if (!response) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    return HttpResponse.json(response);
  }),

  http.get("*/users/:username/collections/:collectionId", ({ params }) => {
    const session = getMockSession();
    const response = getUserCollectionByUsername(
      String(params.username),
      String(params.collectionId),
      session?.user.id,
    );

    if (!response) {
      return HttpResponse.json({ message: "Collection not found" }, { status: 404 });
    }

    return HttpResponse.json(response);
  }),

  http.get("*/tags", () => {
    return HttpResponse.json(listTags());
  }),

  http.post("*/fandoms/suggest", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as { name?: string; description?: string };
    const result = createSuggestedFandom(
      {
        name: payload.name ?? "",
        description: payload.description ?? "",
      },
      session.user.id,
    );

    if ("error" in result) {
      return HttpResponse.json(
        { error: result.error === "exists" ? "fandom already exists" : "invalid input" },
        { status: result.error === "exists" ? 409 : 400 },
      );
    }

    return HttpResponse.json(result, { status: 201 });
  }),

  http.get("*/admin/fandoms/pending", () => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    if (!session.user.isAdmin) {
      return HttpResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return HttpResponse.json(listPendingSuggestedFandoms());
  }),

  http.post("*/admin/fandoms/:fandomId/approve", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    if (!session.user.isAdmin) {
      return HttpResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const result = approveSuggestedFandom(String(params.fandomId));

    if (!result) {
      return HttpResponse.json({ message: "Fandom not found" }, { status: 404 });
    }

    return HttpResponse.json(result);
  }),

  http.post("*/admin/fandoms/:fandomId/reject", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    if (!session.user.isAdmin) {
      return HttpResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const result = rejectSuggestedFandom(String(params.fandomId));

    if (!result) {
      return HttpResponse.json({ message: "Fandom not found" }, { status: 404 });
    }

    return HttpResponse.json(result);
  }),

  http.get("*/stories", ({ request }) => {
    const url = new URL(request.url);
    const query = parseStoriesQuery(url.searchParams);
    const session = getMockSession();

    return HttpResponse.json(listStories(query, session?.user.id));
  }),

  http.get("*/stories/mine", ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = parseStoriesQuery(url.searchParams);

    return HttpResponse.json(listMyStories(query, session.user.id));
  }),

  http.get("*/me/library/shelf", ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const url = new URL(request.url);
    const shelf = url.searchParams.get("shelf") as ReaderShelf | null;

    return HttpResponse.json(listReaderShelf(session.user.id, shelf));
  }),

  http.put("*/me/library/shelf/:storyId", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as { shelf: ReaderShelf };

    if (!setReaderShelf(session.user.id, String(params.storyId), payload.shelf)) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/me/library/shelf/:storyId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    removeReaderShelf(session.user.id, String(params.storyId));

    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/me/collections", () => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    return HttpResponse.json(listMyCollections(session.user.id));
  }),

  http.post("*/me/collections", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as { title?: string; description?: string | null };
    const response = createUserCollection(session.user.id, payload);

    if (!response) {
      return HttpResponse.json({ error: "invalid collection" }, { status: 400 });
    }

    return HttpResponse.json(response, { status: 201 });
  }),

  http.get("*/me/collections/:collectionId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const response = getMyCollection(session.user.id, String(params.collectionId));

    if (!response) {
      return HttpResponse.json({ message: "Collection not found" }, { status: 404 });
    }

    return HttpResponse.json(response);
  }),

  http.patch("*/me/collections/:collectionId", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as { title?: string; description?: string | null };
    const response = updateUserCollection(session.user.id, String(params.collectionId), payload);

    if (!response) {
      return HttpResponse.json({ message: "Collection not found" }, { status: 404 });
    }

    return HttpResponse.json(response);
  }),

  http.delete("*/me/collections/:collectionId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    if (!deleteUserCollection(session.user.id, String(params.collectionId))) {
      return HttpResponse.json({ message: "Collection not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/me/collections/:collectionId/stories", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as { storyId?: string };

    if (!payload.storyId || !addStoryToUserCollection(session.user.id, String(params.collectionId), payload.storyId)) {
      return HttpResponse.json({ message: "Collection or story not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/me/collections/:collectionId/stories/:storyId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    if (!removeStoryFromUserCollection(session.user.id, String(params.collectionId), String(params.storyId))) {
      return HttpResponse.json({ message: "Collection not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/stories", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateStoryPayload;

    return HttpResponse.json(createStoryRecordForAuthor(payload, session.user.id), { status: 201 });
  }),

  http.patch("*/stories/:storyId", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as UpdateStoryPayload;
    const story = updateStoryRecord(String(params.storyId), payload);

    if (!story) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(story);
  }),

  http.delete("*/stories/:storyId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const deleted = deleteStoryRecord(String(params.storyId));

    if (!deleted) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/stories/:slug/chapters/viewed", ({ params }) => {
    const session = getMockSession();
    const response = listStoryChaptersViewed(String(params.slug), session?.user.id);

    if (!response) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(response);
  }),

  http.get("*/stories/:slug", ({ request, params }) => {
    if (passthroughAppRouteRequest(request)) {
      return passthrough();
    }

    const session = getMockSession();
    const story = getStoryBySlug(String(params.slug), session?.user.id);

    if (!story) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(story);
  }),

  http.post("*/chapters/:chapterId/view", ({ params }) => {
    const session = getMockSession();

    markChapterViewed(String(params.chapterId), session?.user.id);

    return new HttpResponse(null, { status: 200 });
  }),

  http.get("*/chapters/:chapterId/viewed", ({ params }) => {
    const session = getMockSession();

    return HttpResponse.json({ viewed: isChapterViewed(String(params.chapterId), session?.user.id) });
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

  http.patch("*/comments/:commentId", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateStoryCommentPayload;
    const comment = updateStoryCommentRecord(String(params.commentId), payload, session.user.id);

    if (!comment) {
      return HttpResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    return HttpResponse.json(comment);
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

    return new HttpResponse(null, { status: 204 });
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
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateChapterPayload;
    const chapter = createChapterRecord(String(params.storyId), payload);

    if (!chapter) {
      return HttpResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return HttpResponse.json(chapter, { status: 201 });
  }),

  http.patch("*/chapters/:chapterId", async ({ params, request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as UpdateChapterPayload;
    const chapter = updateChapterRecord(String(params.chapterId), payload);

    if (!chapter) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json(chapter);
  }),

  http.delete("*/chapters/:chapterId", ({ params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const deleted = deleteChapterRecord(String(params.chapterId));

    if (!deleted) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
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

  http.get("*/chapters/:chapterId", ({ request, params }) => {
    if (passthroughAppRouteRequest(request)) {
      return passthrough();
    }

    const chapter = getChapterById(String(params.chapterId));

    if (!chapter) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return HttpResponse.json(chapter);
  }),

  http.post("*/ai/spellcheck", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as SpellcheckPayload;

    if (!deductMockCredits(session.user.id, AI_CREDIT_COSTS.spellcheck, "spellcheck")) {
      return HttpResponse.json({ error: "insufficient credits" }, { status: 402 });
    }

    return HttpResponse.json(createSpellcheckJob(payload), { status: 202 });
  }),

  http.post("*/ai/logic-check", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as SpellcheckPayload;

    if (!deductMockCredits(session.user.id, AI_CREDIT_COSTS.logicCheck, "logic_check")) {
      return HttpResponse.json({ error: "insufficient credits" }, { status: 402 });
    }

    return HttpResponse.json(createLogicCheckJob(payload), { status: 202 });
  }),

  http.post("*/chapters/:chapterId/canon-check", async ({ request, params }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const chapterId = String(params.chapterId);
    const chapter = getChapterById(chapterId);

    if (!chapter) {
      return HttpResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    if (!deductMockCredits(session.user.id, AI_CREDIT_COSTS.canonCheck, "canon_check")) {
      return HttpResponse.json({ error: "insufficient credits" }, { status: 402 });
    }

    let requestPayload: Partial<SpellcheckPayload> = {};

    try {
      requestPayload = (await request.json()) as Partial<SpellcheckPayload>;
    } catch {
      requestPayload = {};
    }

    const content =
      typeof requestPayload.content === "string" && requestPayload.content.trim()
        ? requestPayload.content
        : chapter.draftContent ?? chapter.content;

    return HttpResponse.json(
      createCanonCheckJob({
        chapterId,
        content,
      }),
      { status: 202 },
    );
  }),

  http.post("*/ai/image-generation", async ({ request }) => {
    const session = getMockSession();

    if (!session) {
      return HttpResponse.json({ error: "no session" }, { status: 401 });
    }

    const payload = (await request.json()) as ImageGenerationPayload;

    if (!deductMockCredits(session.user.id, AI_CREDIT_COSTS.imageGeneration, "image_generation")) {
      return HttpResponse.json({ error: "insufficient credits" }, { status: 402 });
    }

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
