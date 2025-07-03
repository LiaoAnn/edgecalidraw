import { useEffect, useRef } from "react";
import { BufferEvent, BufferEventType } from "@workspace/schemas/events";

const useBufferedWebSocket = (
  handleMessage: (event: BufferEventType) => void,
  id: string,
  bufferTime = 10
) => {
  const bufferedEvents = useRef<Record<string, BufferEventType>>({});
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.PROD
      ? window.location.origin
      : import.meta.env.VITE_SERVER_BASE_URL;
    const wsBaseUrl = baseUrl.replace(/^http/, "ws");
    socketRef.current = new WebSocket(`${wsBaseUrl}/api/ws/${id}`);

    const socket = socketRef.current;

    if (socket) {
      socket.onmessage = (event) => {
        handleMessage(BufferEvent.parse(JSON.parse(event.data)));
      };
      socket.onopen = () => {
        console.log("WebSocket opened");
        socket.send("setup");
      };
    }

    const interval = setInterval(() => {
      if (
        socket &&
        socket.readyState === WebSocket.OPEN &&
        Object.keys(bufferedEvents.current).length > 0
      ) {
        for (const key in bufferedEvents.current) {
          socket.send(JSON.stringify(bufferedEvents.current[key]));
        }

        bufferedEvents.current = {}; // Clear buffer after sending
      }
    }, bufferTime);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.close();
      }
    };
  });

  const sendEvent = (event: BufferEventType) => {
    if (event.type === "pointer") {
      bufferedEvents.current[event.data.userId] = event;
    } else if (event.type === "elementChange") {
      // For a production ready implementation, you would want to handle
      // specific element changes and not the entire element list.
      // This exmaple just saves the entire element list and batches them to
      // the websocket server
      bufferedEvents.current["all-elements"] = event;
    }
  };

  return sendEvent;
};

export default useBufferedWebSocket;
