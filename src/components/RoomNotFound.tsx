import { Link, useNavigate } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";

interface RoomNotFoundProps {
	roomId: string;
}

function RoomNotFound({ roomId }: RoomNotFoundProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
			<div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
				<div className="text-center">
					<div className="text-6xl mb-4">🚫</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						{t("__error.__room_not_found")}
					</h2>
					<p className="text-gray-600 mb-6">
						<Trans
							i18nKey="__error.__room_not_found_message"
							values={{ roomId }}
							components={[
								<span />,
								<code className="bg-gray-100 px-2 py-1 rounded text-sm" />,
							]}
						/>
					</p>
					<div className="flex flex-col gap-3">
						<button
							onClick={() => navigate({ to: "/" })}
							className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
						>
							{t("__error.__back_to_home")}
						</button>
						<Link
							to="/"
							className="text-blue-500 hover:text-blue-600 transition-colors text-sm"
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
