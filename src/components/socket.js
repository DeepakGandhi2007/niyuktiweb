import { io } from "socket.io-client";

const SOCKET_URL = "https://api.niyukti.cloud"; // change

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false
});
