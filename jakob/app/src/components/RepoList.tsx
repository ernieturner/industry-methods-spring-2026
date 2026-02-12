import type { GitHubRepo } from "../types";
import styles from "./RepoList.module.css";

interface RepoListProps {
  repos: GitHubRepo[];
}

export function RepoList({ repos }: RepoListProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Repositories</h3>
      {repos.length === 0 ? (
        <p className={styles.empty}>No public repositories.</p>
      ) : (
        <ul className={styles.list}>
          {repos.map((repo) => (
            <li key={repo.id} className={styles.repo}>
              <div className={styles.repoHeader}>
                <a
                  className={styles.repoName}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {repo.name}
                </a>
                {repo.language && <span className={styles.language}>{repo.language}</span>}
              </div>
              {repo.description && <p className={styles.description}>{repo.description}</p>}
              <div className={styles.meta}>
                <span>{repo.stargazers_count} stars</span>
                <span>{repo.forks_count} forks</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
