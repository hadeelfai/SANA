// App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // your main page
import NewTicketPage from "./pages/NewTicketPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";
import TicketDetailsPage from "./pages/TicketDetailsPage.jsx";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/tickets/new" element={<NewTicketPage />} />
      <Route path="/tickets" element={<MyTicketsPage />} />
      <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      <Route path="/dashboard/employee" element={<EmployeeDashboardPage />} />
    </Routes>
  );
}

export default App;
