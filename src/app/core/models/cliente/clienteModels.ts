export interface CustomerLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface PublicCustomerResponse {
  email: string;
  name: string | null;
  phone: string | null;
  photoUrl: string | null;
}

export interface UpdateCustomerRequest {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  name?: string;
  phone?: string;
  closeSessions?: boolean;
}
