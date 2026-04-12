export interface AuthUser {
  id: number;
  email: string;
  username: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AuthSessionResponse {
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  confirm_password: string;
}

/** Тело PATCH /profile — совпадает с plotty_backend updateProfileRequest */
export interface UpdateProfilePayload {
  username: string;
  avatarUrl: string;
}
