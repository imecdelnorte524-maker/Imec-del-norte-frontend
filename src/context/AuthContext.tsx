// src/context/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LoginData } from "../interfaces/AuthInterfaces";
import type { Usuario } from "../interfaces/UserInterfaces";
import {
  loginRequest,
  requestPasswordResetRequest,
  resetPasswordRequest,
  changePasswordRequest,
} from "../api/auth";
import { playErrorSound } from "../utils/sounds";
import { usersApi } from "../api/users";

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
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  refetchUser: () => Promise<void>;
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
    // Si ya es un Usuario mapeado (viene de usersApi.getMe), úsalo directamente
    if (!userData) {
      // returns a minimal object to satisfy typing (caller should avoid calling with falsy)
      return {
        usuarioId: 0,
        nombre: "",
        apellido: "",
        tipoCedula: "CC",
        cedula: "",
        email: "",
        username: "",
        telefono: "",
        activo: true,
        fechaCreacion: new Date().toISOString(),
        role: { rolId: 0, nombreRol: "Usuario", descripcion: "", fechaCreacion: new Date().toISOString() },
      } as Usuario;
    }

    return {
      usuarioId: userData.usuarioId ?? userData.userId ?? 0,
      nombre: userData.nombre ?? "",
      apellido: userData.apellido ?? "",
      tipoCedula: userData.tipoCedula ?? "CC",
      cedula: userData.cedula ?? "",
      email: userData.email ?? "",
      username: userData.username ?? "",
      telefono: userData.telefono ?? "",
      activo: userData.activo !== undefined ? userData.activo : true,
      fechaCreacion: userData.fechaCreacion ?? new Date().toISOString(),
      fechaNacimiento: userData.fechaNacimiento ?? userData.birthdate ?? undefined,
      genero: userData.genero ?? undefined,
      resetToken: userData.resetToken ?? undefined,
      resetTokenExpiry: userData.resetTokenExpiry ?? undefined,
      mustChangePassword: typeof userData.mustChangePassword === "boolean" ? userData.mustChangePassword : false,
      role: userData.role ?? {
        rolId: userData.rolId ?? 0,
        nombreRol: userData.role?.nombreRol ?? userData.role ?? "Usuario",
        descripcion: userData.role?.descripcion ?? "",
        fechaCreacion: userData.role?.fechaCreacion ?? new Date().toISOString(),
      },
      ubicacionResidencia: (userData as any).ubicacionResidencia ?? (userData as any).ubicacion ?? null,
      arl: (userData as any).arl ?? null,
      eps: (userData as any).eps ?? null,
      afp: (userData as any).afp ?? null,
      contactoEmergenciaNombre: (userData as any).contactoEmergenciaNombre ?? (userData as any).contactoEmergencia?.nombre ?? null,
      contactoEmergenciaTelefono: (userData as any).contactoEmergenciaTelefono ?? (userData as any).contactoEmergencia?.telefono ?? null,
      contactoEmergenciaParentesco: (userData as any).contactoEmergenciaParentesco ?? (userData as any).contactoEmergencia?.parentesco ?? null,
    } as Usuario;
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");

      if (savedToken) {
        try {
          setToken(savedToken);

          try {
            // Preferimos usersApi.getMe (mapea y garantiza estructura)
            const me = await usersApi.getMe();
            const normalizedUser = normalizeUser(me);
            setUser(normalizedUser);
            localStorage.setItem("user", JSON.stringify(normalizedUser));
          } catch (profileError) {
            console.error("Error obteniendo perfil con usersApi.getMe:", profileError);
            // fallback: usar el user guardado en localStorage si existe
            if (savedUser) {
              const savedUserData = JSON.parse(savedUser);
              const normalizedUser = normalizeUser(savedUserData);
              setUser(normalizedUser);
            } else {
              // si no hay user guardado, limpiar token (no autenticado)
              setToken(null);
              localStorage.removeItem("authToken");
            }
          }
        } catch (error) {
          console.error("Token inválido:", error);
          logout();
        }
      } else if (savedUser) {
        // no hay token pero hay usuario guardado (raro), usa el usuario local
        try {
          const parsed = JSON.parse(savedUser);
          const normalizedUser = normalizeUser(parsed);
          setUser(normalizedUser);
        } catch {
          // noop
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

      const actualToken = (res as any).access_token || (res as any).token || (res as any).accessToken;

      if (!actualToken) {
        throw new Error("No se recibió token en la respuesta");
      }

      localStorage.setItem("authToken", actualToken);
      setToken(actualToken);

      // Obtener perfil usando usersApi.getMe (más consistente)
      let userData;
      try {
        userData = await usersApi.getMe();
      } catch (profileError) {
        console.warn("⚠️ No se pudo obtener el perfil tras el login:", profileError);
        // fallback: intentar leer user desde respuesta del login
        userData = (res as any).user ?? null;
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

      // Actualizar estado local: ya no debe cambiar la contraseña obligatoriamente
      setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
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

  const refetchUser = async (): Promise<void> => {
    try {
      setLoading(true);
      const me = await usersApi.getMe();
      const normalizedUser = normalizeUser(me);
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } catch (err: any) {
      console.error("Error refrescando usuario:", err);
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
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};