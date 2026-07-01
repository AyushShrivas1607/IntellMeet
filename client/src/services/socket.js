import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

// autoConnect: false lets us control connection lifecycle manually
// so that disconnect() + navigate() + rejoin works correctly
const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;