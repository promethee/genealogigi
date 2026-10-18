import { t, type MessageKey } from "../i18n/index.ts";

/** What a successful sync did. Translated by the UI, so shells return codes, not sentences. */
export type GitSyncResult = "committed" | "no-changes";

export type GitSyncErrorCode =
  | "no-git"
  | "not-repo"
  | "no-remote"
  | "bad-path"
  | "spawn"
  | "stage"
  | "commit"
  | "no-branch"
  | "merge"
  | "push"
  | "unknown";

const CODES: readonly string[] = [
  "no-git",
  "not-repo",
  "no-remote",
  "bad-path",
  "spawn",
  "stage",
  "commit",
  "no-branch",
  "merge",
  "push",
];

/** A failed sync: a code for the translated sentence plus git's own text, if any. */
export class GitSyncError extends Error {
  constructor(
    readonly code: GitSyncErrorCode,
    readonly detail: string = "",
  ) {
    const message = t(`git.error.${code}` as MessageKey);
    super(detail ? t("git.error.withDetail", { message, detail }) : message);
    this.name = "GitSyncError";
  }
}

/** Turns whatever a shell rejected with ({ code, detail } or a string) into a GitSyncError. */
export function toGitSyncError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "object" && err !== null && "code" in err) {
    const { code, detail } = err as { code: unknown; detail?: unknown };
    const known = typeof code === "string" && CODES.includes(code);
    return new GitSyncError(
      known ? (code as GitSyncErrorCode) : "unknown",
      typeof detail === "string" ? detail : "",
    );
  }
  return new GitSyncError("unknown", String(err));
}
