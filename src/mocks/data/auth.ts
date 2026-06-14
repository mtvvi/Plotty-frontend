import type { AuthSessionResponse, AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from "@/entities/auth/model/types";

import { getCreditBalance } from "./stories";

interface MockAuthDb {
  users: MockAuthUser[];
  currentUserId: number | null;
  nextId: number;
}

type MockAuthUser = AuthUser & { password: string };
const mockAuthUserIdStorageKey = "plotty:mock-auth-user-id";

function createInitialDb(): MockAuthDb {
  return {
    users: [
      {
        id: 1,
        email: "author@gmail.com",
        username: "writer",
        password: "12345678",
        avatar_url: null,
        isAdmin: true,
        created_at: "2026-03-01T10:00:00.000Z",
        updated_at: "2026-03-01T10:00:00.000Z",
      },
    ],
    currentUserId: null,
    nextId: 2,
  };
}

let db = createInitialDb();

function readStoredCurrentUserId() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(mockAuthUserIdStorageKey);
  const userId = rawValue ? Number(rawValue) : NaN;

  return Number.isFinite(userId) ? userId : null;
}

function setCurrentUserId(userId: number | null) {
  db.currentUserId = userId;

  if (typeof window === "undefined") {
    return;
  }

  if (userId === null) {
    window.localStorage.removeItem(mockAuthUserIdStorageKey);
    return;
  }

  window.localStorage.setItem(mockAuthUserIdStorageKey, String(userId));
}

function getCurrentUserId() {
  return db.currentUserId ?? readStoredCurrentUserId();
}

function toAuthSession(user: MockAuthUser): AuthSessionResponse {
  const { password: _password, ...authUser } = user;

  return {
    user: {
      ...authUser,
      credits: getCreditBalance(user.id).balance,
    },
  };
}

export function resetMockAuthDb() {
  db = createInitialDb();
  setCurrentUserId(null);
}

export function getMockSession(): AuthSessionResponse | null {
  const user = db.users.find((item) => item.id === getCurrentUserId());

  return user ? toAuthSession(user) : null;
}

export function loginMockUser(payload: LoginPayload): AuthSessionResponse | null {
  const user = db.users.find((item) => item.email === payload.email && item.password === payload.password);

  if (!user) {
    return null;
  }

  setCurrentUserId(user.id);

  return toAuthSession(user);
}

export function registerMockUser(payload: RegisterPayload) {
  if (db.users.some((item) => item.email === payload.email)) {
    return { error: "user already exists" as const };
  }

  const timestamp = new Date().toISOString();
  const user: MockAuthUser = {
    id: db.nextId,
    email: payload.email,
    username: payload.email.split("@")[0],
    password: payload.password,
    avatar_url: null,
    isAdmin: false,
    created_at: timestamp,
    updated_at: timestamp,
  };

  db.nextId += 1;
  setCurrentUserId(user.id);
  db.users.push(user);

  return toAuthSession(user);
}

export function logoutMockUser() {
  setCurrentUserId(null);
}

export function updateMockUserProfile(payload: UpdateProfilePayload): AuthSessionResponse | { error: string } {
  const user = db.users.find((item) => item.id === db.currentUserId);

  if (!user) {
    return { error: "unauthorized" };
  }

  const timestamp = new Date().toISOString();

  user.username = payload.username.trim();
  user.updated_at = timestamp;

  return toAuthSession(user);
}
