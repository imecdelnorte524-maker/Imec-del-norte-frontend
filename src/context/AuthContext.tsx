// src/context/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LoginData } from "../interfaces/AuthInterfaces";
import type { Usuario } from "../interfaces/UserInterfaces"; // Cambiar a Usuario
import { loginRequest, getProfileRequest } from "../api/auth";

interface AuthContextType {
  user: Usuario | null; // Cambiar a Usuario
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null); // Cambiar a Usuario
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para determinar si es admin
  const isAdmin = user?.role?.nombreRol === 'Administrador' || 
                  user?.role?.nombreRol === 'ADMINISTRADOR' ||
                  user?.role?.nombreRol === 'SG-SST' ||
                  user?.role?.nombreRol === 'SECRETARIA';

  // Función para normalizar el usuario a la interfaz Usuario
  const normalizeUser = (userData: any): Usuario => {
    return {
      usuarioId: userData.usuarioId || userData.userId || 0, // Asegurar que siempre sea number
      nombre: userData.nombre || '',
      apellido: userData.apellido || '',
      tipoCedula: userData.tipoCedula || 'CC',
      cedula: userData.cedula || '',
      email: userData.email || '',
      username: userData.username || '',
      telefono: userData.telefono || '',
      activo: userData.activo !== undefined ? userData.activo : true,
      fechaCreacion: userData.fechaCreacion || new Date().toISOString(),
      resetToken: userData.resetToken,
      resetTokenExpiry: userData.resetTokenExpiry,
      role: userData.role || {
        rolId: userData.rolId || 0,
        nombreRol: userData.rol || userData.role?.nombreRol || 'TECNICO',
        descripcion: userData.role?.descripcion || '',
        fechaCreacion: userData.role?.fechaCreacion || new Date().toISOString()
      }
    };
  };

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          
          // Intentar obtener perfil actualizado del servidor
          try {
            const userData = await getProfileRequest();
            const normalizedUser = normalizeUser(userData.user);
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
          } catch (profileError) {
            console.error('Error obteniendo perfil:', profileError);
            // Si falla, usar los datos guardados
            const savedUserData = JSON.parse(savedUser);
            const normalizedUser = normalizeUser(savedUserData);
            setUser(normalizedUser);
          }
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Hacer login
      const res = await loginRequest(data);

      const actualToken = res.access_token || res.token;

      if (!actualToken) {
        throw new Error('No se recibió token en la respuesta');
      }

      // 2. Guardar token temporalmente
      localStorage.setItem('authToken', actualToken);
      setToken(actualToken);

      // 3. OBTENER PERFIL COMPLETO DESPUÉS DEL LOGIN
      let userData;
      
      try {
        const profileResponse = await getProfileRequest();
        userData = profileResponse.user;
      } catch (profileError) {
        console.warn('⚠️ No se pudo obtener el perfil, usando datos del login:', profileError);
        // Si falla el profile, usar los datos del login
        userData = res.user;
      }

      // 4. Normalizar y guardar usuario
      const normalizedUser = normalizeUser(userData);

      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);


    } catch (err: any) {
      console.error('❌ [AUTH-ERROR] Error en AuthContext login:', err);
      setError(err.message || 'Error de autenticación');
      
      // Limpiar en caso de error
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    window.location.href = '/';
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};