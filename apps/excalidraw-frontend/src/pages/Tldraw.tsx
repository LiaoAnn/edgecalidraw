import { useSync } from "@tldraw/sync";
import { ReactNode, useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { getBookmarkPreview } from "@/lib/getBookmarkPreview";
import { multiplayerAssetStore } from "@/lib/multiplayerAssetStore";
import RoomNotFound from "@/components/RoomNotFound";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

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

export default function TldrawPage() {
  const { id: roomId } = useParams({ from: "/room/$id" });
  const [roomExists, setRoomExists] = useState<boolean | null>(null);

  // 檢查房間是否存在
  useEffect(() => {
    const checkRoomExists = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/exists`);
        const data = await response.json();

        if (data.exists) {
          setRoomExists(true);
          document.title = `${data.room.name} | Edge Tldraw`;
        } else {
          setRoomExists(false);
        }
      } catch (error) {
        console.error("Error checking room existence:", error);
        setRoomExists(false);
      }
    };

    checkRoomExists();
  }, [roomId]);

  // Create a store connected to multiplayer.
  const store = useSync({
    // We need to know the websockets URI...
    uri: `${window.location.origin}/api/connect/${roomId}`,
    // ...and how to handle static assets like images & videos
    assets: multiplayerAssetStore,
  });

  if (roomExists === null) {
    return <LoadingRoom />;
  }

  if (roomExists === false) {
    return <RoomNotFound roomId={roomId} />;
  }

  return (
    <RoomWrapper roomId={roomId}>
      <Tldraw
        // we can pass the connected store into the Tldraw component which will handle
        // loading states & enable multiplayer UX like cursors & a presence menu
        store={store}
        deepLinks
        onMount={(editor) => {
          // when the editor is ready, we need to register our bookmark unfurling service
          editor.registerExternalAssetHandler("url", getBookmarkPreview);
        }}
      />
    </RoomWrapper>
  );
}

function RoomWrapper({
  children,
  roomId,
}: {
  children: ReactNode;
  roomId?: string;
}) {
  const [didCopy, setDidCopy] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!didCopy) return;
    const timeout = setTimeout(() => setDidCopy(false), 3000);
    return () => clearTimeout(timeout);
  }, [didCopy]);

  return (
    <div className="RoomWrapper">
      <div className="RoomWrapper-header">
        <button
          className="mr-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
          onClick={() => navigate({ to: "/" })}
          title={t("__error.__back_to_home")}
        >
          <Icon icon="tabler:arrow-left" />
        </button>
        <WifiIcon />
        <div className="font-bold">{roomId}</div>
        <button
          className="RoomWrapper-copy ml-auto"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setDidCopy(true);
          }}
          aria-label="copy room link"
        >
          {t("__error.__copy_link") || "Copy link"}
          {didCopy && (
            <div className="RoomWrapper-copied">
              {t("__error.__copied") || "Copied!"}
            </div>
          )}
        </button>
      </div>
      <div className="RoomWrapper-content">{children}</div>
    </div>
  );
}

function WifiIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      width={16}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}
