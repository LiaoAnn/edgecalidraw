import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import CreateRoomModal from "../components/CreateRoomModal";
import "./HomePage.css";

interface Room {
  id: string;
  name: string;
  createdAt: string;
  lastActivity: string;
  participantCount: number;
}

function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate({ from: "/" });

  useEffect(() => {
    fetchRooms();
  }, []);

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

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">錯誤: {error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>EdgeCalidraw</h1>
        <p>協作式繪圖平台</p>
      </header>

      <div className="actions">
        <button className="create-room-btn" onClick={createNewRoom}>
          建立新畫布
        </button>
      </div>

      <div className="rooms-section">
        <h2>所有畫布</h2>
        {rooms.length === 0 ? (
          <div className="no-rooms">
            <p>目前沒有任何畫布</p>
            <p>點擊上方按鈕建立你的第一個畫布！</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <Link
                key={room.id}
                to="/room/$id"
                params={{ id: room.id }}
                className="room-card"
              >
                <div className="room-header">
                  <h3>{room.name}</h3>
                  <span className="participant-count">
                    {room.participantCount} 人
                  </span>
                </div>
                <div className="room-meta">
                  <p>建立時間: {formatDate(room.createdAt)}</p>
                  <p>最後活動: {formatDate(room.lastActivity)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}

export default HomePage;
