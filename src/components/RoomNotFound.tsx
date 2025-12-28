import { Link, useNavigate } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";

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
					<h2 className="text-2xl font-bold text-foreground mb-4">
						{t("__error.__room_not_found")}
					</h2>
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
