import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
// Public Pages
import LandingPage from './pages/landing/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';

// Client Dashboard Pages
import ClientOverview from './pages/dashboards/client/ClientOverview';
import CreateProject from './pages/dashboards/client/CreateProject';
import ManageProjects from './pages/dashboards/client/ManageProjects';
import ReviewProposals from './pages/dashboards/client/ReviewProposals';
import ClientProfile from './pages/dashboards/client/ClientProfile';

// Freelancer Dashboard Pages
import FreelancerOverview from './pages/dashboards/freelancer/FreelancerOverview';
import BrowseJobs from './pages/dashboards/freelancer/BrowseJobs';
import Earnings from './pages/dashboards/freelancer/Earnings';
import FreelancerProfile from './pages/dashboards/freelancer/FreelancerProfile';

// Admin Dashboard Pages
import AdminOverview from './pages/dashboards/admin/AdminOverview';
import UserManagement from './pages/dashboards/admin/UserManagement';
import ProjectModeration from './pages/dashboards/admin/ProjectModeration';
import DisputeCenter from './pages/dashboards/admin/DisputeCenter';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Showcase & Marketing */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Simulation / Gateway */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/unauthorized" element={<Unauthorized />} />

          {/* ================= CLIENT ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/client" element={<ClientOverview />} />
            <Route path="/client/create" element={<CreateProject />} />
            <Route path="/client/manage" element={<ManageProjects />} />
            <Route path="/client/proposals" element={<ReviewProposals />} />
            <Route path="/client/profile" element={<ClientProfile />} />
          </Route>

          {/* ================= FREELANCER ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['freelancer']} />}>
            <Route path="/freelancer" element={<FreelancerOverview />} />
            <Route path="/freelancer/browse" element={<BrowseJobs />} />
            <Route path="/freelancer/earnings" element={<Earnings />} />
            <Route path="/freelancer/profile" element={<FreelancerProfile />} />
          </Route>

          {/* ================= ADMIN ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/moderation" element={<ProjectModeration />} />
            <Route path="/admin/disputes" element={<DisputeCenter />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}