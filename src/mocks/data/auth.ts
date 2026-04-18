import type { AuthSessionResponse, AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from "@/entities/auth/model/types";

interface MockAuthDb {
  users: Array<AuthUser & { password: string }>;
  currentUserId: number | null;
  nextId: number;
}

function createInitialDb(): MockAuthDb {
  return {
    users: [
      {
        id: 1,
        email: "writer@plotty.test",
        username: "writer",
        password: "password123",
        avatar_url: null,
        created_at: "2026-03-01T10:00:00.000Z",
        updated_at: "2026-03-01T10:00:00.000Z",
      },
    ],
    currentUserId: null,
    nextId: 2,
  };
}

let db = createInitialDb();

export function resetMockAuthDb() {
  db = createInitialDb();
}

export function getMockSession(): AuthSessionResponse | null {
  const user = db.users.find((item) => item.id === db.currentUserId);

  return user ? { user } : null;
}

export function loginMockUser(payload: LoginPayload): AuthSessionResponse | null {
  const user = db.users.find((item) => item.email === payload.email && item.password === payload.password);

  if (!user) {
    return null;
  }

  db.currentUserId = user.id;

  return { user };
}

export function registerMockUser(payload: RegisterPayload) {
  if (db.users.some((item) => item.email === payload.email)) {
    return { error: "user already exists" as const };
  }

  const timestamp = new Date().toISOString();
  const user: AuthUser & { password: string } = {
    id: db.nextId,
    email: payload.email,
    username: payload.email.split("@")[0],
    password: payload.password,
    avatar_url: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  db.nextId += 1;
  db.currentUserId = user.id;
  db.users.push(user);

  return { user };
}

export function logoutMockUser() {
  db.currentUserId = null;
}

export function updateMockUserProfile(payload: UpdateProfilePayload): AuthSessionResponse | { error: string } {
  const user = db.users.find((item) => item.id === db.currentUserId);

  if (!user) {
    return { error: "unauthorized" };
  }

  const timestamp = new Date().toISOString();

  user.username = payload.username.trim();
  user.updated_at = timestamp;

  return { user };
}
