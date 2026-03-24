import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { Suspense, useEffect } from "react";

import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";

import { LoadingProvider } from "./context/LoadingContext";
import Loading from "./components/Loading";
import { useRealtime } from "./hooks/useEntityRealtime";
import { lazyWithLoader } from "./utils/lazyWithLoader";

const Dashboard = lazyWithLoader(() => import("./pages/Dashboard"), {
  message: "Cargando dashboard...",
});
const Orders = lazyWithLoader(() => import("./pages/Orders"), {
  message: "Cargando órdenes...",
});
const Requirements = lazyWithLoader(() => import("./pages/Requirements"), {
  message: "Cargando requerimientos...",
});
const CostCenters = lazyWithLoader(() => import("./pages/CostCenters"), {
  message: "Cargando centros de costos...",
});
const Reports = lazyWithLoader(() => import("./pages/Reports"), {
  message: "Cargando reportes...",
});
const Inventory = lazyWithLoader(() => import("./pages/Inventory"), {
  message: "Cargando inventario...",
});
const Users = lazyWithLoader(() => import("./pages/Users"), {
  message: "Cargando usuarios...",
});
const Settings = lazyWithLoader(() => import("./pages/Settings"), {
  message: "Cargando configuración...",
});
const SGSST = lazyWithLoader(() => import("./pages/SgSst"), {
  message: "Cargando SG-SST...",
});
const Roles = lazyWithLoader(() => import("./pages/Roles"), {
  message: "Cargando roles...",
});
const Clients = lazyWithLoader(() => import("./pages/Clients"), {
  message: "Cargando clientes...",
});
const EquipmentDetailPage = lazyWithLoader(
  () => import("./pages/EquipmentDetail"),
  { message: "Cargando equipo..." },
);
const EquipmentListPage = lazyWithLoader(
  () => import("./pages/EquipmentList"),
  { message: "Cargando equipos..." },
);
const UserProfilePage = lazyWithLoader(() => import("./pages/UserProfile"), {
  message: "Cargando perfil...",
});
const RecoveryPage = lazyWithLoader(() => import("./pages/Recovey"), {
  message: "Cargando recuperación...",
});
const ResetPasswordPage = lazyWithLoader(
  () => import("./pages/ResetPassword"),
  {
    message: "Cargando...",
  },
);
const RegistrationBoard = lazyWithLoader(
  () => import("./pages/RegistrationBoard"),
  { message: "Cargando tablero..." },
);
const ClientDetailsPage = lazyWithLoader(
  () => import("./pages/ClientDetails"),
  {
    message: "Cargando cliente...",
  },
);
const HumanResources = lazyWithLoader(() => import("./pages/HumanResources"), {
  message: "Cargando recursos humanos...",
});
const NotFound = lazyWithLoader(() => import("./pages/NotFound"), {
  message: "Cargando...",
});

function RealtimeInitializer() {
  const { isAuthenticated } = useAuth();
  useRealtime();

  useEffect(() => {}, [isAuthenticated]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen message="Verificando autenticación..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.mustChangePassword && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* PROTECTED */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
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
      <Route
        path="/sg-sst"
        element={
          <ProtectedRoute>
            <SGSST />
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

      {/* PUBLIC */}
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* NOT FOUND */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <LoadingProvider>
        <RealtimeInitializer />
        <Suspense fallback={null}>
          <AppRoutes />
        </Suspense>
      </LoadingProvider>
    </Router>
  );
}

export default App;
