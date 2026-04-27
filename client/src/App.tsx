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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/course/:slug" component={CourseDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/formateur" component={FormateurDashboard} />
      <Route path="/learn/:slug" component={Learn} />
      <Route path="/verify-certificate" component={VerifyCertificate} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/alumni" component={Alumni} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/edit-course/:slug" component={EditCourse} />
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
