import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token = signal<string | null>(localStorage.getItem('token'));

  // Ahora son propiedades: auth.isLoggedIn() devuelve true/false directo
  isLoggedIn = computed(() => this.token() !== null);

  // Abre el payload del token y lo convierte a objeto
  private payload = computed(() => {
    const t = this.token();
    if (!t) return null;
    try {
      const base64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  });

  isAdmin = computed(() => this.payload()?.role === 'ADMIN');
  nombre = computed(() => {
    const nombre = this.payload()?.nombre;
    return typeof nombre === 'string' ? nombre : null;
  });

  getToken() {
    return this.token();
  }

  setToken(newToken: string) {
    localStorage.setItem('token', newToken);
    this.token.set(newToken);
  }

  clearToken() {
    localStorage.removeItem('token');
    this.token.set(null);
  }
}