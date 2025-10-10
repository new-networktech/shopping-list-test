// Authentication utility functions

export const TOKEN_KEY = 'shopping_list_token';
export const USER_KEY = 'shopping_list_user';

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`,
  };
};

