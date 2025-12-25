import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

const SESSION_COOKIE = "auth_token";

export const login = createServerFn({ method: "POST" })
  .inputValidator((password: string) => password)
  .handler(async ({ data: password }) => {
    const systemPassword = env.SYSTEM_PASSWORD;

    if (password === systemPassword) {
      const token = btoa(`${Date.now()}-verified`);
      setCookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return { success: true };
    }

    return { success: false, message: "密碼錯誤" };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE);
  return { success: true };
});

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = getCookie(SESSION_COOKIE);
    if (!token) return { valid: false };

    try {
      const decoded = atob(token);
      const [timestamp, status] = decoded.split("-");

      if (status === "verified") {
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAge < maxAge) {
          return { valid: true };
        }
      }
    } catch {
      // ignore
    }

    return { valid: false };
  }
);
