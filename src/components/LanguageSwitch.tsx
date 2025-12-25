import { useTranslation } from "react-i18next";

interface LanguageSwitchProps {
	className?: string;
}

const LanguageSwitch = ({ className = "" }: LanguageSwitchProps) => {
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

	return (
		<div className={`relative group ${className}`}>
			<button
				className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
				type="button"
			>
				<span className="text-base">{currentLanguage.flag}</span>
				<span className="hidden sm:inline">{currentLanguage.label}</span>
				<svg
					className="w-4 h-4 ml-1"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{/* Dropdown menu */}
			<div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]">
				{languages.map((language) => (
					<button
						key={language.code}
						onClick={() => handleLanguageChange(language.code)}
						className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
							language.code === i18n.language
								? "bg-indigo-50 text-indigo-700 font-medium"
								: "text-gray-700"
						}`}
					>
						<span className="text-base">{language.flag}</span>
						<span>{language.label}</span>
						{language.code === i18n.language && (
							<svg
								className="w-4 h-4 ml-auto text-indigo-600"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</button>
				))}
			</div>
		</div>
	);
};

export default LanguageSwitch;
