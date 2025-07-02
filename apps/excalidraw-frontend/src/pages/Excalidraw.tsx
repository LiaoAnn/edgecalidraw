import {
  Excalidraw,
  LiveCollaborationTrigger,
  WelcomeScreen,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {
  ExcalidrawImperativeAPI,
  SocketId,
} from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import useBufferedWebSocket from "../hooks/excalidraw-socket";
import {
  BufferEventType,
  PointerEventSchema,
  PointerEvent,
  ExcalidrawElementChangeSchema,
  ExcalidrawElementChange,
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
      const id = Math.random().toString(36).substring(2, 15);
      // Save the ID to localStorage for future use
      localStorage.setItem("userId", id);
      setUserId(id);
    }
  }, []);

  const handleMessage = (event: BufferEventType) => {
    if (event.type === "pointer") {
      handlePointerEvent(event);
    } else if (event.type === "elementChange") {
      handleElementChangeEvent(event);
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
        <WelcomeScreen />
      </Excalidraw>
    </div>
  );
}

export default ExcalidrawComponent;
