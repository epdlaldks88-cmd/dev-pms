import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { KanbanPage } from './pages/projects/KanbanPage';
import { GanttPage } from './pages/projects/GanttPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { PartnersPage } from './pages/partners/PartnersPage';
import { PartnerDetailPage } from './pages/partners/PartnerDetailPage';
import { WorkloadPage } from './pages/workload/WorkloadPage';
import { MeetingsPage } from './pages/meetings/MeetingsPage';
import { ProfilePage } from './pages/settings/ProfilePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <RegisterPage />
            </RequireGuest>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="projects/:projectId/kanban" element={<KanbanPage />} />
          <Route path="projects/:projectId/gantt" element={<GanttPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="partners/:partnerId" element={<PartnerDetailPage />} />
          <Route path="workload" element={<WorkloadPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="settings/profile" element={<ProfilePage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
