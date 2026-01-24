// src/App.tsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Requirements from "./pages/Requirements";
import CostCenters from "./pages/CostCenters";
import Areas from "./pages/Areas";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import SGSST from "./pages/SgSst";
import { useAuth } from "./hooks/useAuth";
import Roles from "./pages/Roles";
import Clients from "./pages/Clients";
import EquipmentDetailPage from "./pages/EquipmentDetail";
import EquipmentListPage from "./pages/EquipmentList";
import UserProfilePage from "./pages/UserProfile";
import RecoveryPage from "./pages/Recovey";
import ResetPasswordPage from "./pages/ResetPassword";
import RegistrationBoard from "./pages/RegistrationBoard";
import ClientDetailsPage from "./pages/ClientDetails";
import HumanResources from "./pages/HumanResources";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario debe cambiar contraseña, lo forzamos a /profile
  if (user?.mustChangePassword && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registration-board"
          element={
            <ProtectedRoute>
              <RegistrationBoard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sg-sst"
          element={
            <ProtectedRoute>
              <SGSST />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requirements"
          element={
            <ProtectedRoute>
              <Requirements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cost-centers"
          element={
            <ProtectedRoute>
              <CostCenters />
            </ProtectedRoute>
          }
        />

        <Route
          path="/areas"
          element={
            <ProtectedRoute>
              <Areas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <ClientDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <EquipmentListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment/:equipmentId"
          element={
            <ProtectedRoute>
              <EquipmentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/human-resources"
          element={
            <ProtectedRoute>
              <HumanResources />
            </ProtectedRoute>
          }
        />

        {/* Recuperación de contraseña (sin auth) */}
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
