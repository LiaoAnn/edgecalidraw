// 這個函數檢查用戶是否已認證
export const checkAuth = async (): Promise<boolean> => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("/api/auth/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

// 這個函數用於需要認證的路由
export const requireAuth = async () => {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    localStorage.removeItem("auth_token");
    // 在 TanStack Router 中，我們可以在組件層面處理認證
    // 這裡我們只返回認證狀態
    return false;
  }
  return true;
};
