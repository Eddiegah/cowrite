/**
 * CoWrite Auth — localStorage-based authentication store.
 * No external auth provider required for v1.
 * Users sign up with name + email + password (hashed client-side with a
 * simple hash — replace with real bcrypt + JWT on a backend for production).
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarInitials: string;
  createdAt: string;
}

const STORAGE_KEY = "cowrite_auth_user";
const ACCOUNTS_KEY = "cowrite_accounts";

const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#10b981",
  "#f59e0b","#3b82f6","#ef4444","#14b8a6",
];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  createdAt: string;
}

function getAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]") as StoredAccount[];
  } catch { return []; }
}

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch { return null; }
}

export function signUp(name: string, email: string, password: string): { user: AuthUser } | { error: string } {
  const accounts = getAccounts();
  if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) {
    return { error: "An account with this email already exists." };
  }
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const account: StoredAccount = {
    id, name: name.trim(), email: email.toLowerCase().trim(),
    passwordHash: simpleHash(password), avatarColor,
    createdAt: new Date().toISOString(),
  };
  accounts.push(account);
  saveAccounts(accounts);

  const user: AuthUser = {
    id, name: name.trim(), email: email.toLowerCase().trim(),
    avatarColor,
    avatarInitials: name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
    createdAt: account.createdAt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Also update the yjs identity
  localStorage.setItem("cowrite_user", JSON.stringify({ name: user.name, color: user.avatarColor }));
  return { user };
}

export function signIn(email: string, password: string): { user: AuthUser } | { error: string } {
  const accounts = getAccounts();
  const account = accounts.find(a => a.email === email.toLowerCase().trim());
  if (!account) return { error: "No account found with this email." };
  if (account.passwordHash !== simpleHash(password)) return { error: "Incorrect password." };

  const user: AuthUser = {
    id: account.id, name: account.name, email: account.email,
    avatarColor: account.avatarColor,
    avatarInitials: account.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
    createdAt: account.createdAt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem("cowrite_user", JSON.stringify({ name: user.name, color: user.avatarColor }));
  return { user };
}

export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function updateProfile(updates: Partial<Pick<AuthUser, "name" | "avatarColor">>): AuthUser | null {
  const current = getStoredUser();
  if (!current) return null;
  const updated: AuthUser = {
    ...current,
    ...updates,
    avatarInitials: (updates.name ?? current.name).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (updates.name || updates.avatarColor) {
    localStorage.setItem("cowrite_user", JSON.stringify({
      name: updated.name, color: updated.avatarColor,
    }));
  }
  return updated;
}
