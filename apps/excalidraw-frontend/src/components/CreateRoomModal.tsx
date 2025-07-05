import { useState } from "react";
import "./CreateRoomModal.css";

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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>建立新畫布</h2>
          <button
            className="close-button"
            onClick={handleClose}
            disabled={isCreating}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="room-title">畫布標題</label>
            <input
              id="room-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="請輸入畫布標題..."
              maxLength={50}
              required
              disabled={isCreating}
              autoFocus
            />
            <div className="input-hint">標題將用於生成房間 ID，支援中英文</div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={isCreating}
            >
              取消
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={!title.trim() || isCreating}
            >
              {isCreating ? "創建中..." : "創建畫布"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;
