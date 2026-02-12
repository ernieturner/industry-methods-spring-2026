import type { GitHubUser } from "../types";
import styles from "./UserCard.module.css";

interface UserCardProps {
  user: GitHubUser;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className={styles.card}>
      <img className={styles.avatar} src={user.avatar_url} alt={`${user.login}'s avatar`} />
      <div className={styles.info}>
        <h2 className={styles.name}>{user.name ?? user.login}</h2>
        <p className={styles.login}>
          <a href={user.html_url} target="_blank" rel="noopener noreferrer">
            @{user.login}
          </a>
        </p>
        {user.bio && <p className={styles.bio}>{user.bio}</p>}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user.public_repos}</span>
            <span className={styles.statLabel}>Repos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user.followers}</span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user.following}</span>
            <span className={styles.statLabel}>Following</span>
          </div>
        </div>
      </div>
    </div>
  );
}
