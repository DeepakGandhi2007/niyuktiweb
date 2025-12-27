import { io } from "socket.io-client";

export const socket = io("https://api.niyukti.cloud", {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false,
});
