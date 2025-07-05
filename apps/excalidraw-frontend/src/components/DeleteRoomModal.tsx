interface DeleteRoomModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteRoomModal({
  isOpen,
  onConfirm,
  onCancel,
}: DeleteRoomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          確認刪除房間
        </h3>
        <p className="text-gray-600 mb-6">
          確定要刪除這個房間嗎？所有繪圖內容將永久遺失，此動作無法復原。
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            刪除房間
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteRoomModal;
