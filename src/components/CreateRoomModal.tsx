import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateRoomModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreateRoom: (title: string) => Promise<void>;
}

function CreateRoomModal({
	isOpen,
	onClose,
	onCreateRoom,
}: CreateRoomModalProps) {
	const { t } = useTranslation();
	const [title, setTitle] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		setIsCreating(true);
		try {
			await onCreateRoom(title.trim());
		} catch (error) {
			console.error("Failed to create room:", error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleClose = () => {
		if (!isCreating) {
			setTitle("");
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-sm"
			onClick={handleClose}
		>
			<div
				className="bg-white rounded-xl w-[90%] max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center px-8 py-6 border-b border-border">
					<h2 className="m-0 text-2xl font-semibold text-foreground">
						{t("__modal.__create_room.__title")}
					</h2>
					<button
						className="bg-none border-none text-2xl text-muted-foreground cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleClose}
						disabled={isCreating}
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-8">
					<div className="mb-6">
						<label
							htmlFor="room-title"
							className="block mb-2 font-medium text-foreground text-sm"
						>
							{t("__modal.__create_room.__canvas_title")}
						</label>
						<input
							id="room-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("__modal.__create_room.__placeholder")}
							maxLength={50}
							required
							disabled={isCreating}
							className="w-full px-3 py-3 border-2 border-border rounded-lg text-base transition-all duration-200 box-border focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_rgba(161,161,170,0.1)] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
						/>
						<div className="mt-2 text-sm text-muted-foreground">
							{t("__modal.__create_room.__title_description")}
						</div>
					</div>

					<div className="flex gap-4 justify-end mt-8">
						<button
							type="button"
							className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none min-w-[100px] bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 disabled:opacity-60 disabled:cursor-not-allowed"
							onClick={handleClose}
							disabled={isCreating}
						>
							{t("__modal.__create_room.__cancel")}
						</button>
						<button
							type="submit"
							className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none min-w-[100px] bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
							disabled={!title.trim() || isCreating}
						>
							{isCreating
								? t("__modal.__create_room.__creating")
								: t("__modal.__create_room.__create")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default CreateRoomModal;
