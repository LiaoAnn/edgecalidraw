import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSync } from "@tldraw/sync";
import { type ReactNode, useEffect, useState } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "@/components/LanguageSwitch";
import RoomNotFound from "@/components/RoomNotFound";
import { getBookmarkPreview } from "@/lib/getBookmarkPreview";
import { multiplayerAssetStore } from "@/lib/multiplayerAssetStore";
import { checkRoomExists, updateRoomActivity } from "@/server/rooms";

export const Route = createFileRoute("/room/$id")({
	component: TldrawPage,
	ssr: false,
});

interface Room {
	id: string;
	name: string;
	createdAt: string;
	lastActivity: string;
}

function LoadingRoom() {
	const { t } = useTranslation();

	return (
		<div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
				<p className="text-gray-600">{t("__error.__loading")}</p>
			</div>
		</div>
	);
}

function TldrawPage() {
	const { id: roomId } = Route.useParams();
	const [roomExists, setRoomExists] = useState<boolean | null>(null);
	const [roomData, setRoomData] = useState<Room | null>(null);

	useEffect(() => {
		const check = async () => {
			try {
				const result = await checkRoomExists({ data: roomId });
				if (result.exists) {
					setRoomExists(true);
					setRoomData(result.room as Room);
					document.title = `${result.room?.name} | Edgecalidraw`;

					// 更新活動時間
					await updateRoomActivity({ data: roomId });
				} else {
					setRoomExists(false);
				}
			} catch (error) {
				console.error("Error checking room existence:", error);
				setRoomExists(false);
			}
		};

		check();
	}, [roomId]);

	const store = useSync({
		uri: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
			window.location.host
		}/api/connect/${roomId}`,
		assets: multiplayerAssetStore,
	});

	if (roomExists === null) {
		return <LoadingRoom />;
	}

	if (roomExists === false) {
		return <RoomNotFound roomId={roomId} />;
	}

	return (
		<RoomWrapper roomId={roomId} roomData={roomData}>
			<div className="absolute inset-0">
				<Tldraw
					autoFocus
					store={store}
					onMount={(editor) => {
						// @ts-expect-error - editor is not typed
						window.editor = editor;
					}}
					// @ts-expect-error - getBookmarkPreview might have type mismatch in React 19
					getBookmarkPreview={getBookmarkPreview}
				/>
			</div>
		</RoomWrapper>
	);
}

function RoomWrapper({
	children,
	roomId,
	roomData,
}: {
	children: ReactNode;
	roomId?: string;
	roomData?: Room | null;
}) {
	const [didCopy, setDidCopy] = useState(false);
	const navigate = useNavigate();
	const { t } = useTranslation();

	useEffect(() => {
		if (!didCopy) return;
		const timeout = setTimeout(() => setDidCopy(false), 3000);
		return () => clearTimeout(timeout);
	}, [didCopy]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString("zh-TW", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="fixed inset-0 flex flex-col">
			<div className="flex flex-row justify-between items-center px-4 py-2 bg-white border-b border-gray-200 text-gray-800 text-sm z-10">
				<div className="flex gap-4">
					<button
						className="mr-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
						onClick={() => navigate({ to: "/" })}
						title={t("__error.__back_to_home")}
					>
						<Icon icon="tabler:arrow-left" className="w-5 h-5" />
					</button>
					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<WifiIcon />
							<div className="font-bold text-base">
								{roomData?.name || roomId}
							</div>
						</div>
						<div className="text-[10px] text-gray-500 flex gap-3 leading-none">
							<span>ID: {roomId}</span>
							{roomData && (
								<>
									<span>
										{t("__room.__created_at")}: {formatDate(roomData.createdAt)}
									</span>
									<span>
										{t("__room.__last_activity")}:{" "}
										{formatDate(roomData.lastActivity)}
									</span>
								</>
							)}
						</div>
					</div>
				</div>
				<div className="flex gap-4">
					<LanguageSwitch variant="icon" className="ml-auto" />
					<button
						className="w-[140px] bg-gray-100 border border-gray-200 rounded px-3 py-1 cursor-pointer relative text-center hover:border-gray-300 transition-colors"
						onClick={() => {
							navigator.clipboard.writeText(window.location.href);
							setDidCopy(true);
						}}
						aria-label="copy room link"
					>
						<span className={didCopy ? "invisible" : ""}>
							{t("__error.__copy_link") || "Copy link"}
						</span>
						{didCopy && (
							<div className="absolute inset-0 flex items-center justify-center">
								{t("__error.__copied") || "Copied!"}
							</div>
						)}
					</button>
				</div>
			</div>
			<div className="relative flex-1">{children}</div>
		</div>
	);
}

function WifiIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth="1.5"
			stroke="currentColor"
			width={16}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"
			/>
		</svg>
	);
}
