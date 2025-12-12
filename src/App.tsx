import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute } from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import ProfileSettings from "./pages/ProfileSettings";
import MoodTracker from "./pages/MoodTracker";
import Journal from "./pages/Journal";
import Breathe from "./pages/Breathe";
import CrisisResources from "./pages/CrisisResources";
import Resources from "./pages/Resources";
import ArticleDetail from "./pages/ArticleDetail";
import { AdminDashboard, AdminUsers, AdminSubscriptions, AdminFeatures, AdminLuna, AdminContent, AdminSafety } from "./pages/admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/mood" element={<MoodTracker />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/breathe" element={<Breathe />} />
            <Route path="/crisis" element={<CrisisResources />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:articleId" element={<ArticleDetail />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <AdminRoute>
                  <AdminSubscriptions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/features"
              element={
                <AdminRoute>
                  <AdminFeatures />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/luna"
              element={
                <AdminRoute>
                  <AdminLuna />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/content"
              element={
                <AdminRoute>
                  <AdminContent />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/safety"
              element={
                <AdminRoute>
                  <AdminSafety />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
