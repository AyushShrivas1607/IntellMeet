import { io } from "socket.io-client";
 
// autoConnect: false lets us control connection lifecycle manually
// so that disconnect() + navigate() + rejoin works correctly
const socket = io("http://localhost:5000", {
  autoConnect: false,
});
 
export default socket;