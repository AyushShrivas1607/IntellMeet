import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MeetingRoom from "./pages/MeetingRoom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MeetingSummary from "./pages/MeetingSummary";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Meeting */}
        <Route
          path="/meeting/:meetingCode"
          element={<MeetingRoom />}
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />
     <Route path="/summary/:roomId" element={<MeetingSummary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;