import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const PasswordScreen = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const authenticate = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // 儲存 token 到 localStorage
        localStorage.setItem("auth_token", data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await authenticate(password);

      if (success) {
        // 成功認證後導航到首頁
        navigate({ to: "/" });
      } else {
        setError("密碼錯誤，請重新輸入");
        setPassword("");
      }
    } catch (error) {
      setError("認證過程中發生錯誤，請稍後再試");
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Edgecalidraw
            </h1>
            <p className="text-gray-600">請輸入系統密碼以訪問管理界面</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                系統密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="請輸入密碼"
                required
                disabled={isLoading}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "驗證中..." : "進入系統"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">忘記密碼？請聯繫系統管理員</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordScreen;
