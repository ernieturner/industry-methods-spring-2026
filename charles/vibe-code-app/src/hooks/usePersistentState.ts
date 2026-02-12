import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export const usePersistentState = <T>(
  storageKey: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const rawValue = window.localStorage.getItem(storageKey);

      if (rawValue === null) {
        return initialValue;
      }

      const parsedValue: unknown = JSON.parse(rawValue);
      return isValid(parsedValue) ? parsedValue : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [storageKey, value]);

  return [value, setValue];
};
