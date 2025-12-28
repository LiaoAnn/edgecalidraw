import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "@/components/LanguageSwitch";
import { Logo } from "@/components/Logo";

const PasswordScreen = () => {
	const { t } = useTranslation();
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		document.title = "Edgecalidraw";
	}, []);

	const authenticate = async (password: string): Promise<boolean> => {
		try {
			const response = await fetch("/api/auth/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ password }),
			});

			const data = (await response.json()) as {
				success: boolean;
				token: string;
			};

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
		<div className="min-h-screen flex items-center justify-center bg-background">
			{/* Language Switch - 固定在右上角 */}
			<div className="fixed top-4 right-4 z-10">
				<LanguageSwitch />
			</div>

			<div className="max-w-md w-full mx-4">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					<div className="text-center mb-8">
						<div className="flex flex-col items-center mb-4">
							<Logo className="w-20 h-20 mb-4" />
							<h1 className="text-4xl font-bold text-foreground">
								{t("__app.__title")}
							</h1>
						</div>
						<p className="text-muted-foreground">
							{t("__auth.__access_prompt")}
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-foreground mb-2"
							>
								{t("__auth.__system_password")}
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-colors"
								placeholder={t("__auth.__enter_password")}
								required
								disabled={isLoading}
							/>
							{error && (
								<p className="mt-2 text-sm text-destructive">{error}</p>
							)}
						</div>

						<button
							type="submit"
							disabled={isLoading || !password.trim()}
							className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
						>
							{isLoading ? t("__auth.__verifying") : t("__auth.__enter_system")}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-muted-foreground">
							{t("__auth.__forgot_password")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PasswordScreen;
