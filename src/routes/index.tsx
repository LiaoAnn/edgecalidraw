import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateRoomModal from "@/components/CreateRoomModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import LanguageSwitch from "@/components/LanguageSwitch";
import { logout as logoutFn } from "@/server/auth";
import { createRoom, deleteRoom, getRooms } from "@/server/rooms";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		isOpen: boolean;
		roomId: string;
		roomName: string;
	}>({
		isOpen: false,
		roomId: "",
		roomName: "",
	});

	const {
		data: rooms = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["rooms"],
		queryFn: () => getRooms(),
	});

	const createRoomMutation = useMutation({
		mutationFn: (title: string) => createRoom({ data: title }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
			setIsModalOpen(false);
			navigate({ to: "/room/$id", params: { id: data.id } });
		},
	});

	const deleteRoomMutation = useMutation({
		mutationFn: (roomId: string) => deleteRoom({ data: roomId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
			setDeleteConfirm({ isOpen: false, roomId: "", roomName: "" });
		},
	});

	const logoutMutation = useMutation({
		mutationFn: () => logoutFn(),
		onSuccess: () => {
			navigate({ to: "/" });
		},
	});

	useEffect(() => {
		document.title = "Edgecalidraw";
	}, []);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString("zh-TW", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto">
				<div className="flex justify-between items-center mb-12">
					<div>
						<h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
							{t("__app.__title")}
						</h1>
						<p className="text-lg text-gray-600">{t("__app.__subtitle")}</p>
					</div>
					<div className="flex items-center space-x-4">
						<LanguageSwitch />
						<button
							onClick={() => logoutMutation.mutate()}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							{t("__auth.__logout")}
						</button>
						<button
							onClick={() => setIsModalOpen(true)}
							className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
						>
							{t("__room.__create_new")}
						</button>
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
						<p className="text-red-700">{t("__error.__fetch_rooms_failed")}</p>
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{rooms.map((room) => (
						<div
							key={room.id}
							className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group"
						>
							<div className="p-6">
								<div className="flex justify-between items-start mb-4">
									<h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate pr-4">
										{room.name}
									</h3>
									<button
										onClick={(e) => {
											e.preventDefault();
											setDeleteConfirm({
												isOpen: true,
												roomId: room.id,
												roomName: room.name,
											});
										}}
										className="text-gray-400 hover:text-red-500 transition-colors p-1"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
								<div className="space-y-2 text-sm text-gray-500 mb-6">
									<div className="flex items-center">
										<svg
											className="w-4 h-4 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										{t("__room.__created_at")}: {formatDate(room.createdAt)}
									</div>
									<div className="flex items-center">
										<svg
											className="w-4 h-4 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										{t("__room.__last_activity")}:{" "}
										{formatDate(room.lastActivity)}
									</div>
								</div>
								<Link
									to="/room/$id"
									params={{ id: room.id }}
									className="block w-full text-center py-2 bg-gray-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100"
								>
									{t("__room.__enter")}
								</Link>
							</div>
						</div>
					))}
				</div>

				{rooms.length === 0 && !isLoading && (
					<div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
						<svg
							className="mx-auto h-12 w-12 text-gray-400 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						<h3 className="text-lg font-medium text-gray-900 mb-1">
							{t("__room.__no_rooms")}
						</h3>
						<p className="text-gray-500 mb-6">{t("__room.__create_first")}</p>
						<button
							onClick={() => setIsModalOpen(true)}
							className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
						>
							{t("__room.__create_new")}
						</button>
					</div>
				)}
			</div>

			<CreateRoomModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onCreateRoom={async (title) => {
					await createRoomMutation.mutateAsync(title);
				}}
			/>

			<DeleteConfirmModal
				isOpen={deleteConfirm.isOpen}
				onCancel={() =>
					setDeleteConfirm({ isOpen: false, roomId: "", roomName: "" })
				}
				onConfirm={() => deleteRoomMutation.mutate(deleteConfirm.roomId)}
				roomName={deleteConfirm.roomName}
			/>
		</div>
	);
}
