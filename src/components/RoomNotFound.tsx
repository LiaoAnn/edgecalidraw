import { Link, useNavigate } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";

interface RoomNotFoundProps {
	roomId: string;
}

function RoomNotFound({ roomId }: RoomNotFoundProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="fixed inset-0 bg-muted flex items-center justify-center">
			<div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
				<div className="text-center">
					<div className="text-6xl mb-4">🚫</div>
					<div className="flex flex-col items-center mb-6">
						<Logo className="w-16 h-16 mb-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
						<h2 className="text-2xl font-bold text-foreground">
							{t("__error.__room_not_found")}
						</h2>
					</div>
					<p className="text-muted-foreground mb-6">
						<Trans
							i18nKey="__error.__room_not_found_message"
							values={{ roomId }}
							components={[
								<span />,
								<code className="bg-muted px-2 py-1 rounded text-sm" />,
							]}
						/>
					</p>
					<div className="flex flex-col gap-3">
						<button
							onClick={() => navigate({ to: "/" })}
							className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
						>
							{t("__error.__back_to_home")}
						</button>
						<Link
							to="/"
							className="text-primary hover:text-primary/80 transition-colors text-sm"
						>
							{t("__error.__view_all_rooms")}
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default RoomNotFound;
