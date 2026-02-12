import { useState } from "react";
import { fetchUser, fetchRepos } from "./api";
import type { GitHubUser, GitHubRepo } from "./types";
import { SearchBar } from "./components/SearchBar";
import { UserCard } from "./components/UserCard";
import { RepoList } from "./components/RepoList";
import { ErrorMessage } from "./components/ErrorMessage";
import styles from "./App.module.css";

export function App() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (username: string) => {
    setLoading(true);
    setError(null);
    setUser(null);
    setRepos([]);

    try {
      const [userData, repoData] = await Promise.all([
        fetchUser(username),
        fetchRepos(username),
      ]);
      setUser(userData);
      setRepos(repoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>GitHub Profile Explorer</h1>
      <p className={styles.subtitle}>Search any GitHub user to view their profile and repositories</p>
      <SearchBar onSearch={handleSearch} loading={loading} />
      {error && <ErrorMessage message={error} />}
      {user && (
        <>
          <UserCard user={user} />
          <RepoList repos={repos} />
        </>
      )}
    </div>
  );
}
