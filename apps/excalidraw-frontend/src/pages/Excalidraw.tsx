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
import { Link } from "@tanstack/react-router";
import useBufferedWebSocket from "../hooks/excalidraw-socket";
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

function ExcalidrawComponent() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const { id } = useParams({ from: "/room/$id" });

  const [userId, setUserId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isCollaborating, setIsCollaborating] = useState(false);

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
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen />
      </Excalidraw>
    </div>
  );
}

export default ExcalidrawComponent;
