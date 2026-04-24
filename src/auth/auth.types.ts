export type SessionUser = {
  githubId: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
};

export type AuthRequest = {
  headers: {
    cookie?: string;
  };
  user?: SessionUser;
} & Record<string, unknown>;
