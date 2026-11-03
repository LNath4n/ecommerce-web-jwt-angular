export interface LoginClienteDto {
  email: string;
  password: string;
}

export interface ClientePublico {
  email: string;
  nombre: string | null;
  telefono: string;
  fotoUrl?: string;
}

export interface ClienteEditarRequest {
  email?: string;
  passwordVieja?: string;
  passwordNueva?: string;
  nombre?: string;
  telefono?: string;
  cerrarSesiones?: boolean;
}

export interface CreacionClienteRespuestaDto {
  id: number;
  email: string;
}
export interface LoginResponse {
  token: string;
}
