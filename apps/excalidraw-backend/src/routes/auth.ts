import { Hono } from "hono";
import { z } from "zod";

const auth = new Hono<{ Bindings: CloudflareBindings }>();

const AuthRequestSchema = z.object({
  password: z.string().min(1, "密碼不能為空"),
});

// 驗證系統密碼的路由
auth.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { password } = AuthRequestSchema.parse(body);

    const systemPassword = c.env.SYSTEM_PASSWORD;

    if (!systemPassword) {
      return c.json({ success: false, message: "系統配置錯誤" }, 500);
    }

    if (password === systemPassword) {
      // 生成一個簡單的 token（實際應用中應該使用 JWT）
      const token = btoa(`${Date.now()}-verified`);

      return c.json({
        success: true,
        message: "認證成功",
        token,
      });
    } else {
      return c.json({ success: false, message: "密碼錯誤" }, 401);
    }
  } catch (error) {
    return c.json({ success: false, message: "請求格式錯誤" }, 400);
  }
});

// 驗證 token 的路由
auth.post("/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(body);

    // 簡單的 token 驗證（實際應用中應該使用 JWT）
    try {
      const decoded = atob(token);
      const [timestamp, status] = decoded.split("-");

      if (status === "verified") {
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 小時

        if (tokenAge < maxAge) {
          return c.json({ valid: true });
        }
      }
    } catch {
      // token 解碼失敗
    }

    return c.json({ valid: false }, 401);
  } catch (error) {
    return c.json({ valid: false }, 400);
  }
});

export default auth;
