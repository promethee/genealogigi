import { RELEASES_API, RELEASES_PAGE } from "../appInfo.ts";

export interface ParsedVersion {
  numbers: [number, number, number];
  /** Text after "-", e.g. "beta.1"; empty for a normal release. */
  pre: string;
}

/** "1.2.3", "v1.2.3" and "1.2.3-beta.1" parse; anything else is null. */
export function parseVersion(text: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(text.trim());
  if (!match) return null;
  return {
    numbers: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] ?? "",
  };
}

/** True only when `latest` is certainly newer than `current`; unparseable input is never newer. */
export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    const x = a.numbers[i] as number;
    const y = b.numbers[i] as number;
    if (x !== y) return x > y;
  }
  // Same numbers: a normal release is newer than its own pre-release.
  if (a.pre === b.pre) return false;
  if (a.pre === "") return true;
  if (b.pre === "") return false;
  return a.pre.localeCompare(b.pre, undefined, { numeric: true }) > 0;
}

export type UpdateCheck =
  | { status: "available"; latest: string; url: string }
  | { status: "current" }
  | { status: "failed" };

type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const TIMEOUT_MS = 5000;

/** Only GitHub pages are ever opened, whatever the response says. */
function safeUrl(url: unknown): string {
  return typeof url === "string" && url.startsWith("https://github.com/") ? url : RELEASES_PAGE;
}

/**
 * Asks GitHub for the latest published release (drafts and pre-releases are excluded by the
 * endpoint). No release yet (404) counts as "current"; any other problem is "failed".
 * Sends no family data: it is a plain read of public information.
 */
export async function checkForUpdate(
  fetchFn: FetchLike,
  currentVersion: string,
): Promise<UpdateCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchFn(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (response.status === 404) return { status: "current" };
    if (!response.ok) return { status: "failed" };
    const release = (await response.json()) as { tag_name?: unknown; html_url?: unknown };
    if (typeof release.tag_name !== "string" || !parseVersion(release.tag_name)) {
      return { status: "failed" };
    }
    const latest = release.tag_name.replace(/^v/, "");
    return isNewerVersion(latest, currentVersion)
      ? { status: "available", latest, url: safeUrl(release.html_url) }
      : { status: "current" };
  } catch {
    return { status: "failed" };
  } finally {
    clearTimeout(timer);
  }
}
