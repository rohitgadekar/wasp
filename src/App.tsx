import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CodeLibrary from "./pages/CodeLibrary";
import CsvVisualizer from "./pages/CsvVisualizer";
import UserManagement from "./pages/UserManagement";
import Maps from "./pages/Maps";
import Wiki from "./pages/Wiki";
import Scripts from "./pages/Scripts";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import SnippetViewer from "./components/SnippetViewser";
import ScriptViewer from "./components/ScriptViewer";
import WikiPageViewer from "./components/WikiViewer";
import StatusViewer from "./components/StatusViewer";
import DailyStatus from "./pages/DailyStatus";
import Leaderboard from "./pages/LeaderBoard";
import MyAccount from "./pages/MyAccount";
import MapGenerator from "./pages/MapGenerator";
import Leaves from "./pages/Leaves";
import DocumentFinder from "./pages/DocumentFinder";
import AiAgent from "./pages/AiAgent";
import Hive from "./pages/Hive";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import ExportLogs from "./components/ExportLogs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache garbage collected after 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <CodeLibrary />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/s/:id" element={<SnippetViewer />} />
            <Route path="/api/logs" element={<ExportLogs />} />
            <Route path="/script/:id" element={<ScriptViewer />} />
            <Route path="/w/:id" element={<WikiPageViewer />} />
            <Route path="/p/status" element={<ProtectedRoute>
              <StatusViewer />
            </ProtectedRoute>} />

            <Route path="/csv-visualizer" element={
              <ProtectedRoute>
                <Layout>
                  <CsvVisualizer />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/document-finder" element={
              <ProtectedRoute>
                <Layout>
                  <DocumentFinder />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Layout>
                  <Leaderboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <Layout>
                  <MyAccount />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/map-generator" element={
              <ProtectedRoute>
                <Layout>
                  <MapGenerator />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/maps" element={
              <ProtectedRoute>
                <Layout>
                  <Maps />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/status" element={
              <ProtectedRoute>
                <Layout>
                  <DailyStatus />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/wiki" element={
              <ProtectedRoute>
                <Layout>
                  <Wiki />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/scripts" element={
              <ProtectedRoute>
                <Layout>
                  <Scripts />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/leaves" element={
              <ProtectedRoute>
                <Layout>
                  <Leaves />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ai-agent" element={
              <ProtectedRoute>
                <Layout>
                  <AiAgent />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/hive" element={
              <ProtectedRoute>
                <Layout>
                  <Hive />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/insight-studio" element={
              <ProtectedRoute>
                <Layout>
                  <AdvancedAnalytics />
                </Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
