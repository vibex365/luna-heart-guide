import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute } from "@/components/AdminRoute";
import { OfflineBanner } from "@/components/OfflineBanner";
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";
import { RateAppPrompt } from "@/components/RateAppPrompt";
import Landing from "./pages/Landing";
import { AuthRedirect } from "@/components/AuthRedirect";
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
import { CouplesGames, CouplesGifts, CouplesHealth, CouplesDaily } from "./pages/couples/index";
import DMFunnel from "./pages/DMFunnel";
import CouplesFunnel from "./pages/CouplesFunnel";
import Welcome from "./pages/Welcome";
import CouplesWelcome from "./pages/CouplesWelcome";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AppStoreAssets from "./pages/AppStoreAssets";
import PromoVideoTemplate from "./pages/PromoVideoTemplate";
import PromoVideos from "./pages/PromoVideos";
import CoinPurchase from "./pages/CoinPurchase";
import { AdminDashboard, AdminUsers, AdminSubscriptions, AdminFeatures, AdminLuna, AdminContent, AdminSafety, AdminModeration, AdminCoins, AdminMinutes, AdminAnalytics, AdminFunnelAnalytics, AdminMarketing, AdminSettings, AdminFeedback, AdminNotifications, AdminBlog } from "./pages/admin";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PitchDeck from "./pages/PitchDeck";
import LunaVoice from "./pages/LunaVoice";
import Library from "./pages/Library";
import EbookReader from "./pages/EbookReader";
import DateNight from "./pages/DateNight";
import ColoringBook from "./pages/ColoringBook";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App(): React.ReactElement {
  return (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BiometricLockScreen />
        <RateAppPrompt />
        <DeepLinkHandler />
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/dm" element={<DMFunnel />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/settings" element={<ProfileSettings />} />
          <Route path="/mood" element={<MoodTracker />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/breathe" element={<Breathe />} />
          <Route path="/crisis" element={<CrisisResources />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/:articleId" element={<ArticleDetail />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/couples" element={<Couples />} />
          <Route path="/couples/games" element={<CouplesGames />} />
          <Route path="/couples/gifts" element={<CouplesGifts />} />
          <Route path="/couples/health" element={<CouplesHealth />} />
          <Route path="/couples/daily" element={<CouplesDaily />} />
          <Route path="/couples-funnel" element={<CouplesFunnel />} />
          <Route path="/couples-welcome" element={<CouplesWelcome />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/app-store-assets" element={<AppStoreAssets />} />
          <Route path="/promo-video" element={<PromoVideoTemplate />} />
          <Route path="/promo-videos" element={<PromoVideos />} />
          <Route path="/coins" element={<CoinPurchase />} />
          <Route path="/luna-voice" element={<LunaVoice />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:bookId" element={<EbookReader />} />
          <Route path="/date-night" element={<DateNight />} />
          <Route path="/date-night/coloring" element={<ColoringBook />} />
          <Route path="/date-night/recipes" element={<Recipes />} />
          <Route path="/date-night/recipes/:recipeId" element={<RecipeDetail />} />
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
            path="/admin/moderation"
            element={
              <AdminRoute>
                <AdminModeration />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/coins"
            element={
              <AdminRoute>
                <AdminCoins />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/minutes"
            element={
              <AdminRoute>
                <AdminMinutes />
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
          <Route
            path="/admin/blog"
            element={
              <AdminRoute>
                <AdminBlog />
              </AdminRoute>
            }
          />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/pitch" element={<PitchDeck />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
}

export default App;
