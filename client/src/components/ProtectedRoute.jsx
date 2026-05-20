import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function ProtectedRoute({ children }) {
  const { pharmacist } = useAuthStore();

  if (!pharmacist) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
