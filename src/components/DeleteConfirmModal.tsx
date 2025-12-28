import { useTranslation } from "react-i18next";

interface DeleteConfirmModalProps {
	isOpen: boolean;
	roomName: string;
	onConfirm: () => void;
	onCancel: () => void;
}

function DeleteConfirmModal({
	isOpen,
	roomName,
	onConfirm,
	onCancel,
}: DeleteConfirmModalProps) {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg p-6 max-w-md w-full">
				<h3 className="text-lg font-semibold mb-4 text-foreground">
					{t("__modal.__delete_confirm.__title")}
				</h3>
				<p className="text-muted-foreground mb-6">
					{t("__modal.__delete_confirm.__message", { roomName })}
				</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onCancel}
						className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
					>
						{t("__modal.__delete_confirm.__cancel")}
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
					>
						{t("__modal.__delete_confirm.__delete")}
					</button>
				</div>
			</div>
		</div>
	);
}

export default DeleteConfirmModal;
