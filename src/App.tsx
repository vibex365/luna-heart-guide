import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute } from "@/components/AdminRoute";
import { OfflineBanner } from "@/components/OfflineBanner";
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";
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
import Subscription from "./pages/Subscription";
import Couples from "./pages/Couples";
import DMFunnel from "./pages/DMFunnel";
import CouplesFunnel from "./pages/CouplesFunnel";
import Welcome from "./pages/Welcome";
import CouplesWelcome from "./pages/CouplesWelcome";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { AdminDashboard, AdminUsers, AdminSubscriptions, AdminFeatures, AdminLuna, AdminContent, AdminSafety, AdminAnalytics, AdminFunnelAnalytics, AdminMarketing, AdminSettings, AdminFeedback, AdminNotifications } from "./pages/admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <DeepLinkHandler>
          <Toaster />
          <Sonner />
          <OfflineBanner />
          <BiometricLockScreen />
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dm" element={<DMFunnel />} />
          <Route path="/welcome" element={<Welcome />} />
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
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/couples" element={<Couples />} />
          <Route path="/couples-funnel" element={<CouplesFunnel />} />
          <Route path="/couples-welcome" element={<CouplesWelcome />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
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
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/funnels"
            element={
              <AdminRoute>
                <AdminFunnelAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/marketing"
            element={
              <AdminRoute>
                <AdminMarketing />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <AdminRoute>
                <AdminFeedback />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <AdminNotifications />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </DeepLinkHandler>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
