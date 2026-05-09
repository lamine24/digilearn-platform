import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FormateurDashboard from "./pages/FormateurDashboard";
import Learn from "./pages/Learn";
import VerifyCertificate from "./pages/VerifyCertificate";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentPage from "./pages/PaymentPage";
import Alumni from "./pages/Alumni";
import ChatWidget from "./components/ChatWidget";
import Onboarding from "./pages/Onboarding";
import EditCourse from "./pages/EditCourse";
import CreateCourse from "./pages/CreateCourse";
import ReorderResources from "./pages/ReorderResources";

import { SearchPage } from "./pages/SearchPage";
import { FreeResourcesPage } from "./pages/FreeResourcesPage";
import { FreeResourceDetail } from "./pages/FreeResourceDetail";
import { PremiumSubscriptionPage } from "./pages/PremiumSubscriptionPage";
import { AdminSubscriptionsPage } from "./pages/AdminSubscriptionsPage";
import { AdminNotificationSettingsPage } from "./pages/AdminNotificationSettingsPage";
import { AdminPaymentHistoryPage } from "./pages/AdminPaymentHistoryPage";
import UserDashboard from "./pages/UserDashboard";
import StudioDashboard from "./pages/StudioDashboard";
import StudioProject from "./pages/StudioProject";
import { CapsulePreview } from "./pages/CapsulePreview";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/course/:slug" component={CourseDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/subscriptions" component={AdminSubscriptionsPage} />
      <Route path="/admin/notification-settings" component={AdminNotificationSettingsPage} />
      <Route path="/admin/payment-history" component={AdminPaymentHistoryPage} />
      <Route path="/formateur" component={FormateurDashboard} />
      <Route path="/learn/:slug" component={Learn} />
      <Route path="/verify-certificate" component={VerifyCertificate} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/alumni" component={Alumni} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/edit-course/:slug" component={EditCourse} />
      <Route path="/formateur/create-course" component={CreateCourse} />
      <Route path="/formateur/reorder-resources/:moduleId" component={ReorderResources} />

      <Route path="/search" component={SearchPage} />
      <Route path="/free-resources" component={FreeResourcesPage} />
      <Route path="/free-resource/:slug" component={FreeResourceDetail} />
      <Route path="/premium" component={PremiumSubscriptionPage} />
      <Route path="/user-dashboard" component={UserDashboard} />
      <Route path="/studio" component={StudioDashboard} />
      <Route path="/studio/capsule/:id" component={CapsulePreview} />
      <Route path="/studio/:slug" component={StudioProject} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
