import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import Protected from "./components/Protected.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateTournament from "./pages/createTournament.jsx";
import TournamentDetails from "./pages/TournamentDetails.jsx";
import MatchAdmin from "./pages/MatchAdmin.jsx";
import LiveMatch from "./pages/LiveMatch.jsx";
import Sports from "./pages/Sports";
import Volleyball from "./pages/Volleyball";
import Football from "./pages/Football";
import Hockey from "./pages/Hockey";
import Basketball from "./pages/Basketball";
import Badminton from "./pages/Badminton";
import Kabaddi from "./pages/Kabaddi";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        <Route
          path="/create"
          element={
            <Protected>
              <CreateTournament />
            </Protected>
          }
        />

        <Route
          path="/tournaments/:id"
          element={
            <Protected>
              <TournamentDetails />
            </Protected>
          }
        />

        <Route
          path="/matches/:id/admin"
          element={
            <Protected>
              <MatchAdmin />
            </Protected>
          }
        />

        <Route path="/matches/:id/live" element={<LiveMatch />} />

        <Route path="/sports" element={<Sports />} />
        <Route path="/sports/volleyball" element={<Volleyball />} />
        <Route path="/sports/football" element={<Football />} />
        <Route path="/sports/hockey" element={<Hockey />} />
        <Route path="/sports/basketball" element={<Basketball />} />
        <Route path="/sports/badminton" element={<Badminton />} />
        <Route path="/sports/kabaddi" element={<Kabaddi />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>,
);
