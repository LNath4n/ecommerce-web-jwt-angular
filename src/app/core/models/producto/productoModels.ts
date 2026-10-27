export interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  marca: string;
  precioPublicoIva: number;
  imagenUrl: string | null;
  stock: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface ProductoPublicoResponse {
  id: number;
  slug: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  plataforma: string | null;
  tipo: string;
  region: string | null;
  valorNominal: number | null;
  moneda: string | null;
  precioVenta: number;
  instruccionesCanje: string | null;
  imagenUrl: string | null;
  stock: number;
}

export interface CategoriaOpcionResponse {
  id: number;
  nombre: string;
}

export type TipoProducto =
  | 'GIFT_CARD'
  | 'CLAVE_JUEGO'
  | 'LICENCIA_SOFTWARE'
  | 'RECARGA'
  | 'SUSCRIPCION';

export interface ProductoRequest {
  sku: string;
  nombre: string;
  descripcion?: string | null;
  plataforma?: string | null;
  tipo: TipoProducto;
  region?: string | null;
  valorNominal?: number | null;
  moneda?: string | null;
  precioVenta: number;
  precioCosto?: number | null;
  instruccionesCanje?: string | null;
  activo?: boolean | null;
  categoriaId?: number | null;
}

export interface ProductoAdminResponse {
  id: number;
  sku: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  plataforma: string | null;
  tipo: TipoProducto;
  region: string | null;
  valorNominal: number | null;
  moneda: string | null;
  precioVenta: number;
  precioCosto: number | null;
  instruccionesCanje: string | null;
  activo: boolean;
  categoriaId: number | null;
  imagenUrl: string | null;
  stock: number;
  fechaCreacion: string;
}
