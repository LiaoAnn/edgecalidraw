import {
  Excalidraw,
  LiveCollaborationTrigger,
  MainMenu,
  WelcomeScreen,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {
  ExcalidrawImperativeAPI,
  SocketId,
} from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import useBufferedWebSocket from "@/hooks/excalidraw-socket";
import {
  BufferEventType,
  PointerEventSchema,
  PointerEvent,
  ExcalidrawElementChangeSchema,
  ExcalidrawElementChange,
  UserJoinEvent,
  UserLeaveEvent,
} from "@workspace/schemas/events";
import { useParams } from "@tanstack/react-router";

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

interface RoomNotFoundProps {
  roomId: string;
}

function RoomNotFound({ roomId }: RoomNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">房間不存在</h2>
          <p className="text-gray-600 mb-6">
            抱歉，房間{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              {roomId}
            </code>{" "}
            不存在或已被刪除。
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate({ to: "/" })}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              返回首頁
            </button>
            <Link
              to="/"
              className="text-blue-500 hover:text-blue-600 transition-colors text-sm"
            >
              查看所有房間
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingRoom() {
  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">正在檢查房間...</p>
      </div>
    </div>
  );
}

function ExcalidrawComponent() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const { id } = useParams({ from: "/room/$id" });
  const navigate = useNavigate({ from: "/room/$id" });

  const [userId, setUserId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | null>(null); // null = loading, true = exists, false = not exists

  // 檢查房間是否存在
  useEffect(() => {
    const checkRoomExists = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}/exists`);
        const data = await response.json();

        if (data.exists) {
          setRoomExists(true);
        } else {
          setRoomExists(false);
        }
      } catch (error) {
        console.error("Error checking room existence:", error);
        setRoomExists(false);
      }
    };

    checkRoomExists();
  }, [id]);

  // Initialize canvas size and set up resize listener
  useEffect(() => {
    // Function to update canvas size based on window size
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    // Try to get userId from localStorage first
    const storedId = localStorage.getItem("userId");

    if (storedId) {
      setUserId(storedId);
    } else {
      // Generate a new ID if none exists
      const newId = Math.random().toString(36).substring(2, 15);
      // Save the ID to localStorage for future use
      localStorage.setItem("userId", newId);
      setUserId(newId);
    }

    // 當進入房間時，更新房間的最後活動時間
    const updateRoomActivity = async () => {
      try {
        await fetch(`/api/rooms/${id}/activity`, {
          method: "PATCH",
        });
      } catch (error) {
        console.log("Could not update room activity:", error);
      }
    };

    updateRoomActivity();
  }, [id]);

  const handleDeleteRoom = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      // 刪除成功後導航回首頁
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("刪除房間失敗，請稍後再試");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteRoom = () => {
    setShowDeleteModal(false);
  };

  const handleMessage = (event: BufferEventType) => {
    if (event.type === "pointer") {
      handlePointerEvent(event);
    } else if (event.type === "elementChange") {
      handleElementChangeEvent(event);
    } else if (event.type === "userJoin") {
      handleUserJoinEvent(event);
    } else if (event.type === "userLeave") {
      handleUserLeaveEvent(event);
    }
  };

  const handlePointerEvent = (event: PointerEvent) => {
    if (!excalidrawAPI) return;

    const allCollaborators = excalidrawAPI.getAppState().collaborators;
    const collaborator = new Map(allCollaborators);
    collaborator.set(event.data.userId as SocketId, {
      username: event.data.userId,
      pointer: {
        x: event.data.x,
        y: event.data.y,
        tool: "laser",
      },
    });
    if (userId) {
      collaborator.delete(userId as SocketId);
    }
    setIsCollaborating(collaborator.size > 1);
    excalidrawAPI.updateScene({
      collaborators: collaborator,
    });
  };

  const handleElementChangeEvent = (event: ExcalidrawElementChange) => {
    if (excalidrawAPI) {
      // Update the scene with the new elements
      excalidrawAPI.updateScene({
        elements: event.data,
      });
    }
  };

  const handleUserJoinEvent = (event: UserJoinEvent) => {
    console.log("User joined:", event.data.userId);
    // The user is added to collaborators when they send pointer events
    // This is just for logging purposes
  };

  const handleUserLeaveEvent = (event: UserLeaveEvent) => {
    if (!excalidrawAPI) return;

    console.log("User left:", event.data.userId);
    const allCollaborators = excalidrawAPI.getAppState().collaborators;
    const collaborator = new Map(allCollaborators);

    // Remove the user from collaborators
    collaborator.delete(event.data.userId as SocketId);

    // Update collaboration state
    setIsCollaborating(collaborator.size > 0);

    excalidrawAPI.updateScene({
      collaborators: collaborator,
    });
  };

  const sendEventViaSocket = useBufferedWebSocket(handleMessage, id);

  if (roomExists === null) {
    // 房間存在性檢查中
    return <LoadingRoom />;
  }

  if (roomExists === false) {
    // 房間不存在
    return <RoomNotFound roomId={id} />;
  }

  return (
    <div
      className="canvas"
      style={{
        height: `${canvasSize.height}px`,
        width: `${canvasSize.width}px`,
        position: "relative",
      }}
    >
      <Excalidraw
        onPointerUpdate={(payload) => {
          sendEventViaSocket(
            PointerEventSchema.parse({
              type: "pointer",
              data: {
                userId: userId,
                x: payload.pointer.x,
                y: payload.pointer.y,
              },
            })
          );
        }}
        onPointerUp={() => {
          if (excalidrawAPI) {
            sendEventViaSocket(
              ExcalidrawElementChangeSchema.parse({
                type: "elementChange",
                data: excalidrawAPI.getSceneElements(),
              })
            );
          }
        }}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        isCollaborating={isCollaborating}
        renderTopRightUI={() => (
          <LiveCollaborationTrigger
            isCollaborating={isCollaborating}
            onSelect={() => setIsCollaborating(true)}
          />
        )}
      >
        <MainMenu>
          <MainMenu.ItemCustom>
            <Link
              to="/"
              style={{
                padding: "8px 8px",
                backgroundColor: "#f0f0f0",
                color: "#333",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                border: "1px solid #ddd",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e0e0e0";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
            >
              ←
            </Link>
          </MainMenu.ItemCustom>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.ItemCustom>
            <button
              onClick={handleDeleteRoom}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#c82333";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#dc3545";
              }}
            >
              刪除房間
            </button>
          </MainMenu.ItemCustom>
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen />
      </Excalidraw>

      <DeleteRoomModal
        isOpen={showDeleteModal}
        onConfirm={confirmDeleteRoom}
        onCancel={cancelDeleteRoom}
      />
    </div>
  );
}

export default ExcalidrawComponent;
