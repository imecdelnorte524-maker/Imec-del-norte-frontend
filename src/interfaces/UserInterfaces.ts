export interface Rol {
  rolId: number;
  nombreRol: string;
  descripcion?: string;
  fechaCreacion?: string;
}

export interface CreateRolDto {
  nombreRol: string;
  descripcion?: string;
}

export interface UpdateRolDto {
  nombreRol?: string;
  descripcion?: string;
}

export interface Usuario {
  usuarioId: number;
  nombre: string;
  apellido: string;
  tipoCedula: string;
  cedula: string;
  email: string;
  username: string;
  telefono: string;
  activo: boolean;
  fechaCreacion: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  mustChangePassword?: boolean;
  role: Rol;
}

export interface CreateUsuarioDto {
  nombre: string;
  apellido: string;
  tipoCedula: string;
  cedula: string;
  email: string;
  username: string;
  password: string;
  telefono: string;
  rolId: number;
  activo?: boolean;
}

export interface UpdateUsuarioDto {
  nombre?: string;
  apellido?: string;
  tipoCedula?: string;
  cedula?: string;
  email?: string;
  username?: string;
  password?: string;
  telefono?: string;
  rolId?: number;
  activo?: boolean;
}