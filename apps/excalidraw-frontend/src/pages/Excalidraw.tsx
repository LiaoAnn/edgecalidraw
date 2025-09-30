import {
  Excalidraw,
  LiveCollaborationTrigger,
  MainMenu,
  useHandleLibrary,
  WelcomeScreen,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {
  ExcalidrawImperativeAPI,
  SocketId,
} from "@excalidraw/excalidraw/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import RoomNotFound from "@/components/RoomNotFound";
import { Theme } from "@excalidraw/excalidraw/element/types";
import { ArrowLeftIcon } from "@/components/Icons";
import { t } from "i18next";
import { useNavigate } from "@tanstack/react-router";
import { LibraryAPIAdapter } from "@/lib/library-api-adapter";

function getTheme(theme: Theme | "system"): Theme {
  if (theme !== "system") return theme;

  // check prefers-color-scheme
  if (typeof window !== "undefined" && window.matchMedia) {
    // check if the system prefers dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  }
  // Fallback to light theme if prefers-color-scheme is not supported
  return "light";
}

function LoadingRoom() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">{t("__error.__loading")}</p>
      </div>
    </div>
  );
}

function ExcalidrawComponent() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const { id } = useParams({ from: "/room/$id" });

  const [userId, setUserId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | null>(null); // null = loading, true = exists, false = not exists
  const [theme, setTheme] = useState<Theme | "system">("light");

  const updateTheme = (newTheme: Theme | "system") => {
    setTheme(newTheme);
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: {
          theme: getTheme(newTheme),
        },
      });
    }
  };

  // 檢查房間是否存在
  useEffect(() => {
    const checkRoomExists = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}/exists`);
        const data = await response.json();

        if (data.exists) {
          setRoomExists(true);
          document.title = `${data.room.name} | Edgecalidraw`;
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

  const handlePointerEvent = useCallback(
    (event: PointerEvent) => {
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
      setIsCollaborating(collaborator.size > 0);
      excalidrawAPI.updateScene({
        collaborators: collaborator,
      });
    },
    [excalidrawAPI, userId]
  );

  const handleElementChangeEvent = useCallback(
    (event: ExcalidrawElementChange) => {
      if (excalidrawAPI) {
        // Update the scene with the new elements
        excalidrawAPI.updateScene({
          elements: event.data,
        });
      }
    },
    [excalidrawAPI]
  );

  const handleUserJoinEvent = useCallback((event: UserJoinEvent) => {
    console.log("User joined:", event.data.userId);
    // The user is added to collaborators when they send pointer events
    // This is just for logging purposes
  }, []);

  const handleUserLeaveEvent = useCallback(
    (event: UserLeaveEvent) => {
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
    },
    [excalidrawAPI]
  );

  const handleMessage = useCallback(
    (event: BufferEventType) => {
      if (event.type === "pointer") {
        handlePointerEvent(event);
      } else if (event.type === "elementChange") {
        handleElementChangeEvent(event);
      } else if (event.type === "userJoin") {
        handleUserJoinEvent(event);
      } else if (event.type === "userLeave") {
        handleUserLeaveEvent(event);
      }
    },
    [
      handlePointerEvent,
      handleElementChangeEvent,
      handleUserJoinEvent,
      handleUserLeaveEvent,
    ]
  );

  // 為 WebSocket 事件發送函數創建一個引用
  const sendEventRef = useRef<(event: BufferEventType) => void>(() => {});

  // Set different buffer times based on collaboration status
  // When collaborating, use a faster update rate (15ms)
  // When not collaborating, use a slower update rate (50ms)
  const bufferTime = useMemo(() => {
    return isCollaborating ? 15 : 50;
  }, [isCollaborating]);

  // 使用帶有 bufferTime 參數的 useBufferedWebSocket
  const sendEvent = useBufferedWebSocket(handleMessage, id, bufferTime);

  // 保存視圖位置到 localStorage
  const saveViewState = useCallback(() => {
    if (excalidrawAPI) {
      const appState = excalidrawAPI.getAppState();
      const viewState = {
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      };
      localStorage.setItem(`roomViewState_${id}`, JSON.stringify(viewState));
    }
  }, [excalidrawAPI, id]);

  // 從 localStorage 恢復視圖位置
  const restoreViewState = useCallback(() => {
    if (excalidrawAPI) {
      const savedState = localStorage.getItem(`roomViewState_${id}`);
      if (savedState) {
        try {
          const viewState = JSON.parse(savedState);
          excalidrawAPI.updateScene({
            appState: {
              scrollX: viewState.scrollX,
              scrollY: viewState.scrollY,
              zoom: viewState.zoom,
            },
          });
        } catch (error) {
          console.error("Error restoring view state:", error);
        }
      }
    }
  }, [excalidrawAPI, id]);

  // 當 excalidrawAPI 設置後，恢復視圖狀態
  useEffect(() => {
    if (excalidrawAPI) {
      restoreViewState();
    }
  }, [excalidrawAPI, restoreViewState]);

  // 當離開頁面時保存視圖狀態
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveViewState();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveViewState();
    };
  }, [saveViewState]);

  // 創建一個穩定的 API 來發送事件
  const sendEventViaSocket = useCallback((event: BufferEventType) => {
    sendEventRef.current(event);
  }, []);

  // 每當 sendEvent 更新時，更新引用
  useEffect(() => {
    sendEventRef.current = sendEvent;
  }, [sendEvent]);

  // handle library items
  useHandleLibrary({
    excalidrawAPI,
    adapter: LibraryAPIAdapter,
  });

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
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        isCollaborating={isCollaborating}
        langCode={i18n.language}
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
        renderTopRightUI={() => (
          <LiveCollaborationTrigger
            isCollaborating={isCollaborating}
            onSelect={() => setIsCollaborating(true)}
          />
        )}
      >
        <MainMenu>
          <MainMenu.ItemCustom>
            <MainMenu.Item
              icon={ArrowLeftIcon}
              onSelect={() => navigate({ to: "/" })}
              aria-label={t("__error.__back_to_home")}
            >
              {t("__error.__back_to_home")}
            </MainMenu.Item>
          </MainMenu.ItemCustom>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme
            allowSystemTheme
            theme={theme}
            onSelect={updateTheme}
          />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen />
      </Excalidraw>
    </div>
  );
}

export default ExcalidrawComponent;
