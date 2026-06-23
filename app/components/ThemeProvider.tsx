"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pulse-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline no-flash script in layout.tsx has already set the `.dark`/`.light`
  // class on <html> before hydration; read it so our state matches immediately.
  const [theme, setTheme] = useState<Theme>(() => {
    if (
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("light")
    ) {
      return "light";
    }
    return "dark";
  });

  const apply = useCallback((next: Theme) => {
    const el = document.documentElement;
    el.classList.remove("light", "dark");
    el.classList.add(next);
    // sessionStorage (not localStorage) so the preference dies with the tab —
    // consistent with Pulse's "nothing is stored, closing the tab ends it" model.
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [theme, apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
