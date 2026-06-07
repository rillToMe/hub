const TOKEN_KEY = "adminToken";
const EXPIRY_KEY = "tokenExpiry";

export const AuthStorage = {
  setToken(token: string, expiresIn = 3_600_000): void {
    const expiry = Date.now() + expiresIn;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
  },

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);

    if (!token || !expiry) return null;

    if (Date.now() > parseInt(expiry, 10)) {
      this.clearToken();
      return null;
    }

    return token;
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  },

  isTokenValid(): boolean {
    return this.getToken() !== null;
  },
};
