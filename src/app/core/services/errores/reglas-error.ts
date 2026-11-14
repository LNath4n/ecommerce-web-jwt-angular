import { ReglaError } from './ErrorMensajesService';

export const reglasStock = (claveStock = 'CART.ERRORS.STOCK_EXCEEDED'): ReglaError[] => [
  {
    status: 400,
    patron: /Cannot (?:add|have) (\d+) units? of (.+?); only (\d+) (?:are|is) in stock/,
    clave: claveStock,
    params: m => ({ producto: m[2], stock: m[3] }),
  },
  {
    status: 400,
    patron: /You already have (\d+) of (.+?) in your cart and only (\d+) .*?You can add (\d+) more/,
    clave: 'CART.ERRORS.CART_STOCK_EXCEEDED',
    params: m => ({ enCarrito: m[1], producto: m[2], stock: m[3], disponibles: m[4] }),
  },
];