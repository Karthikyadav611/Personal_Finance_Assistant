import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ If Dashboard uses "export default"
import Dashboard from "./pages/Dashboard";

// ✅ If RegisterPage & LoginPage use "export const RegisterPage/LoginPage"
import { RegisterPage } from "./pages/Register";
import { LoginPage } from "./pages/Login";

import NotFound from "./pages/NotFound";
import { LandingPage } from "./components/LandingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;