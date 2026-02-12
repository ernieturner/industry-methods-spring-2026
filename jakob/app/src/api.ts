import type { GitHubUser, GitHubRepo } from "./types";

const BASE = "https://api.github.com";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("User not found");
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchUser(username: string): Promise<GitHubUser> {
  return fetchJson<GitHubUser>(`${BASE}/users/${encodeURIComponent(username)}`);
}

export function fetchRepos(username: string): Promise<GitHubRepo[]> {
  return fetchJson<GitHubRepo[]>(
    `${BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=stars&direction=desc`
  );
}
