// src/context/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LoginData } from "../interfaces/AuthInterfaces";
import type { Usuario } from "../interfaces/UserInterfaces";
import {
  loginRequest,
  getProfileRequest,
  requestPasswordResetRequest,
  resetPasswordRequest,
  changePasswordRequest,
} from "../api/auth";
import { playErrorSound } from "../utils/sounds";

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<string>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin =
    user?.role?.nombreRol === "Administrador" ||
    user?.role?.nombreRol === "ADMINISTRADOR" ||
    user?.role?.nombreRol === "SG-SST" ||
    user?.role?.nombreRol === "SECRETARIA";

  const normalizeUser = (userData: any): Usuario => {
    return {
      usuarioId: userData.usuarioId || userData.userId || 0,
      nombre: userData.nombre || "",
      apellido: userData.apellido || "",
      tipoCedula: userData.tipoCedula || "CC",
      cedula: userData.cedula || "",
      email: userData.email || "",
      username: userData.username || "",
      telefono: userData.telefono || "",
      activo: userData.activo !== undefined ? userData.activo : true,
      fechaCreacion: userData.fechaCreacion || new Date().toISOString(),
      resetToken: userData.resetToken,
      resetTokenExpiry: userData.resetTokenExpiry,
      mustChangePassword:
        typeof userData.mustChangePassword === "boolean"
          ? userData.mustChangePassword
          : false,
      role: userData.role || {
        rolId: userData.rolId || 0,
        nombreRol: userData.rol || userData.role?.nombreRol || "TECNICO",
        descripcion: userData.role?.descripcion || "",
        fechaCreacion:
          userData.role?.fechaCreacion || new Date().toISOString(),
      },
    };
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);

          try {
            const userData = await getProfileRequest();
            const normalizedUser = normalizeUser(userData.user);
            setUser(normalizedUser);
            localStorage.setItem("user", JSON.stringify(normalizedUser));
          } catch (profileError) {
            console.error("Error obteniendo perfil:", profileError);
            const savedUserData = JSON.parse(savedUser);
            const normalizedUser = normalizeUser(savedUserData);
            setUser(normalizedUser);
          }
        } catch (error) {
          console.error("Token inválido:", error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await loginRequest(data);

      const actualToken = (res as any).access_token || (res as any).token;

      if (!actualToken) {
        throw new Error("No se recibió token en la respuesta");
      }

      localStorage.setItem("authToken", actualToken);
      setToken(actualToken);

      let userData;

      try {
        const profileResponse = await getProfileRequest();
        userData = profileResponse.user;
      } catch (profileError) {
        console.warn(
          "⚠️ No se pudo obtener el perfil, usando datos del login:",
          profileError
        );
        userData = (res as any).user;
      }

      const normalizedUser = normalizeUser(userData);

      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    } catch (err: any) {
      console.error("❌ [AUTH-ERROR] Error en AuthContext login:", err);
      setError(err.message || "Error de autenticación");
      playErrorSound();

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser(null);
      setToken(null);

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // SOLO limpiar estado, sin recargar toda la página
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  const requestPasswordReset = async (email: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const res = await requestPasswordResetRequest(email);
      return (
        res.message ||
        "Si el email existe, se enviará un enlace de recuperación"
      );
    } catch (err: any) {
      console.error("❌ [AUTH-ERROR] Error en requestPasswordReset:", err);
      setError(
        err.message || "Error solicitando recuperación de contraseña"
      );
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    tokenValue: string,
    password: string
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const res = await resetPasswordRequest(tokenValue, password);
      return res.message || "Contraseña actualizada exitosamente";
    } catch (err: any) {
      console.error("❌ [AUTH-ERROR] Error en resetPassword:", err);
      setError(err.message || "Error al actualizar la contraseña");
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const res = await changePasswordRequest(currentPassword, newPassword);

      // Ya no está obligado a cambiar contraseña
      setUser((prev) =>
        prev ? { ...prev, mustChangePassword: false } : prev
      );
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.mustChangePassword = false;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      return res.message || "Contraseña actualizada exitosamente";
    } catch (err: any) {
      console.error("❌ [AUTH-ERROR] Error en changePassword:", err);
      setError(err.message || "Error al cambiar la contraseña");
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin,
    requestPasswordReset,
    resetPassword,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};