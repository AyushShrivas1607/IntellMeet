import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import global from "global";
window.global = window;
ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);