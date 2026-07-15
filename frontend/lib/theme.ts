"use client";

export type Theme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("cowrite_theme") as Theme) || "dark";
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cowrite_theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const t = getTheme();
  document.documentElement.setAttribute("data-theme", t);
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
