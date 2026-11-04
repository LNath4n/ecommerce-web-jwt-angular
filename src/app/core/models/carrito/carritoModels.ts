export interface AgregarCarrito {
  idProducto: number;
  cantidad: number;
}

export interface ActualizarCantidad {
  idProducto: number;
  cantidad: number;
}

export interface CarritoProducto {
  productoId: number;
  slug: string;
  nombre: string;
  sku: string;
  plataforma: string | null;
  cantidad: number;
  precioVenta: number;
  imagenUrl: string | null;
}

export interface Carrito {
  id: number;
  productos: CarritoProducto[];
  fechaCreacion: string;
  subtotal: number;
}