import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserDashboard from "./pages/UserDashboard";
import NagarpalikaDashboard from "./pages/NagarPalikaDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for User Dashboard */}
        <Route path="/" element={<UserDashboard />} />

        {/* Route for Nagarpalika Dashboard */}
        <Route path="/nagarpalika" element={<NagarpalikaDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;