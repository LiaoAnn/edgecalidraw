import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "@/components/LanguageSwitch";

const PasswordScreen = () => {
  const { t } = useTranslation();
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
        setError(t("__auth.__password_error"));
        setPassword("");
      }
    } catch (error) {
      setError(t("__auth.__auth_error"));
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Language Switch - 固定在右上角 */}
      <div className="fixed top-4 right-4 z-10">
        <LanguageSwitch />
      </div>

      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {t("__app.__title")}
            </h1>
            <p className="text-gray-600">{t("__auth.__access_prompt")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("__auth.__system_password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder={t("__auth.__enter_password")}
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
              {isLoading ? t("__auth.__verifying") : t("__auth.__enter_system")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t("__auth.__forgot_password")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordScreen;
