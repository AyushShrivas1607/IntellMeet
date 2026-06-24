import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MeetingRoom from "./pages/MeetingRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/meeting/:meetingCode"
          element={<MeetingRoom />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;