import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "@/components/LanguageSwitch";
import { login } from "@/server/auth";

export const Route = createFileRoute("/login")({
	component: Login,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			redirect: (search.redirect as string) || "/",
		};
	},
});

function Login() {
	const { t } = useTranslation();
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: "/login" });

	useEffect(() => {
		document.title = "Edgecalidraw";
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const result = await login({ data: password });
			if (result.success) {
				navigate({ to: redirect });
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
			<div className="fixed top-4 right-4 z-10">
				<LanguageSwitch />
			</div>

			<div className="max-w-md w-full mx-4">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold mb-2 text-foreground">
							{t("__app.__title")}
						</h1>
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
							disabled={isLoading}
							className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? t("__auth.__authenticating") : t("__auth.__login")}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
