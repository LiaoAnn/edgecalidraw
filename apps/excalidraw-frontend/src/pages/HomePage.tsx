import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import CreateRoomModal from "@/components/CreateRoomModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Room {
  id: string;
  name: string;
  createdAt: string;
  lastActivity: string;
}

function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const navigate = useNavigate({ from: "/" });

  useEffect(() => {
    fetchRooms();
  }, []);

  const logout = () => {
    localStorage.removeItem("auth_token");
    navigate({ to: "/login" });
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      setRooms(data.rooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const createNewRoom = () => {
    setIsModalOpen(true);
  };

  const handleCreateRoom = async (title: string) => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      const roomId = data.roomId;

      // 關閉彈窗
      setIsModalOpen(false);

      // 重新獲取房間列表以顯示最新數據
      await fetchRooms();

      // 導航到新房間
      navigate({ to: "/room/$id", params: { id: roomId } });
    } catch (error) {
      console.error("Error creating room:", error);
      alert("創建房間失敗，請稍後再試");
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    setDeleteConfirm({ isOpen: true, roomId, roomName });
  };

  const confirmDeleteRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${deleteConfirm.roomId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      // 關閉確認彈窗
      setDeleteConfirm({ isOpen: false, roomId: "", roomName: "" });

      // 重新獲取房間列表
      await fetchRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("刪除房間失敗，請稍後再試");
    }
  };

  const cancelDeleteRoom = () => {
    setDeleteConfirm({ isOpen: false, roomId: "", roomName: "" });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8 font-sans">
        <div className="text-center py-12 text-xl text-gray-600">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8 font-sans">
        <div className="text-center py-12 text-xl text-red-600">
          錯誤: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 font-sans">
      <header className="text-center mb-12 relative">
        <button
          onClick={logout}
          className="absolute top-0 right-0 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          登出
        </button>
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Edgecalidraw
        </h1>
        <p className="text-xl text-gray-600 m-0">協作式繪圖平台</p>
      </header>

      <div className="flex justify-center mb-12">
        <button
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 text-lg font-semibold rounded-lg cursor-pointer transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
          onClick={createNewRoom}
        >
          建立新畫布
        </button>
      </div>

      <div className="rooms-section">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">所有畫布</h2>
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-2">目前沒有任何畫布</p>
            <p className="text-lg">點擊上方按鈕建立你的第一個畫布！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500 relative group"
              >
                <Link
                  to="/room/$id"
                  params={{ id: room.id }}
                  className="no-underline text-inherit block"
                >
                  <div className="flex justify-between items-start mb-4 flex-col sm:flex-row sm:gap-4">
                    <h3 className="text-xl font-semibold m-0 text-gray-800 flex-1">
                      {room.name}
                    </h3>
                  </div>
                  <div className="text-gray-600 text-sm">
                    <p className="my-1">
                      建立時間: {formatDate(room.createdAt)}
                    </p>
                    <p className="my-1">
                      最後活動: {formatDate(room.lastActivity)}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteRoom(room.id, room.name);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  title="刪除畫布"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        roomName={deleteConfirm.roomName}
        onConfirm={confirmDeleteRoom}
        onCancel={cancelDeleteRoom}
      />
    </div>
  );
}

export default HomePage;
