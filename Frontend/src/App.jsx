// App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // your main page
import NewTicketPage from "./pages/NewTicketPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/tickets/new" element={<NewTicketPage />} />
    </Routes>
  );
}

export default App;
