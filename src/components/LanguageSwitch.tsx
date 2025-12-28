import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

const LanguageSwitch = ({
	className = "",
	variant = "full",
}: {
	className?: string;
	variant?: "full" | "icon";
}) => {
	const { i18n } = useTranslation();

	const languages = [
		{ code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
		{ code: "en", label: "English", flag: "🇺🇸" },
	];

	const currentLanguage =
		languages.find((lang) => lang.code === i18n.language) || languages[0];

	const handleLanguageChange = (languageCode: string) => {
		i18n.changeLanguage(languageCode);
		try {
			localStorage.setItem("language", languageCode);
		} catch {
			console.warn("Unable to save language preference to localStorage");
		}
	};

	if (variant === "icon") {
		return (
			<div className={`relative group ${className}`}>
				<button
					className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
					type="button"
				>
					<Icon icon="mdi:web" className="w-5 h-5" />
				</button>

				{/* Dropdown menu */}
				<div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]">
					{languages.map((language) => (
						<button
							key={language.code}
							onClick={() => handleLanguageChange(language.code)}
							className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
								language.code === i18n.language
									? "bg-secondary text-secondary-foreground font-medium"
									: "text-foreground"
							}`}
						>
							<span className="text-base">{language.flag}</span>
							<span>{language.label}</span>
							{language.code === i18n.language && (
								<Icon
									icon="mdi:check"
									className="w-4 h-4 ml-auto text-primary"
								/>
							)}
						</button>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className={`relative group ${className}`}>
			<button
				className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
				type="button"
			>
				<span className="text-base">{currentLanguage.flag}</span>
				<span className="hidden sm:inline">{currentLanguage.label}</span>
				<Icon icon="mdi:chevron-down" className="w-4 h-4 ml-1" />
			</button>

			{/* Dropdown menu */}
			<div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]">
				{languages.map((language) => (
					<button
						key={language.code}
						onClick={() => handleLanguageChange(language.code)}
						className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
							language.code === i18n.language
								? "bg-secondary text-secondary-foreground font-medium"
								: "text-foreground"
						}`}
					>
						<span className="text-base">{language.flag}</span>
						<span>{language.label}</span>
						{language.code === i18n.language && (
							<Icon icon="mdi:check" className="w-4 h-4 ml-auto text-primary" />
						)}
					</button>
				))}
			</div>
		</div>
	);
};

export default LanguageSwitch;
