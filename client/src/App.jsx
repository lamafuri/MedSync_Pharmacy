import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AppShell from './components/AppShell';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import OffersPage from './pages/OffersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import LinkedPatientsPage from './pages/LinkedPatientsPage';

function App() {
  const { pharmacist } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={!pharmacist ? <LoginPage /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="linked-patients" element={<LinkedPatientsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
