// src/interfaces/AuthInterfaces.ts
export interface LoginResponse {
  message: string;
  token?: string;
  access_token?: string;
  user: {
    userId?: number;
    usuarioId?: number;
    username: string;
    email: string;
    nombre: string;
    apellido: string;
    rol?: string;
    role?: any;
    telefono?: string;
  };
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  userId?: number;
  usuarioId?: number;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol?: string;
  role?: any;
  rolId?: number;
  tipoCedula?: string;
  cedula?: string;
  activo?: boolean;
  fechaCreacion?: string;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
}