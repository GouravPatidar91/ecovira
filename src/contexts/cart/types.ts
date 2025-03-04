
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  unit: string;
  image: string;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  images?: string[];
}

export type CartAction =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_CART' };
