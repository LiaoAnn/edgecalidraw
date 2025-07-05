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
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200">
          <h2 className="m-0 text-2xl font-semibold text-gray-800">
            {t("__modal.__create_room.__title")}
          </h2>
          <button
            className="bg-none border-none text-2xl text-gray-600 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="block mb-2 font-medium text-gray-800 text-sm"
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
              autoFocus
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 box-border focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
            <div className="mt-2 text-sm text-gray-600">
              {t("__modal.__create_room.__title_description")}
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-8">
            <button
              type="button"
              className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none min-w-[100px] bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isCreating}
            >
              {t("__modal.__create_room.__cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border-none min-w-[100px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
