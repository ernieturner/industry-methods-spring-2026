import { useState, type FormEvent } from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSearch: (username: string) => void;
  loading: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Enter a GitHub username..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className={styles.button} type="submit" disabled={loading || !input.trim()}>
        {loading ? "Loading..." : "Search"}
      </button>
    </form>
  );
}
