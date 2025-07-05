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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {t("__modal.__delete_confirm.__title")}
        </h3>
        <p className="text-gray-600 mb-6">
          {t("__modal.__delete_confirm.__message", { roomName })}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("__modal.__delete_confirm.__cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            {t("__modal.__delete_confirm.__delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
