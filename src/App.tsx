import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeEffects } from "@/components/ThemeEffects";
import GlobalBackground from "./components/GlobalBackground";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthError from "./pages/AuthError";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TestConnection from "./pages/TestConnection";
import Clubs from "./pages/Clubs";
import Cinema from "./pages/Cinema";
import Moderation from "./pages/Moderation";
import CityHall from "./pages/CityHall";
import Explore from "./pages/Explore";
import PublicProfile from "./pages/PublicProfile";
import PrivacySettings from "./pages/PrivacySettings";
import Messages from "./pages/Messages";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ClubPage from "./pages/ClubPage";
import Invites from "./pages/Invites";
import { Gamification } from "./pages/Gamification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <GlobalBackground>
          <ThemeEffects />
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="/clubs/:clubId" element={<ClubPage />} />
              <Route path="/invites" element={<Invites />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/cinema" element={<Cinema />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="/city-hall" element={<CityHall />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/privacy-settings" element={<PrivacySettings />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/test-connection" element={<TestConnection />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </GlobalBackground>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;