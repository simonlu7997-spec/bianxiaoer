import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const CART_STORAGE_KEY = "@bianxiaoer_cart";

export interface CartItem {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  spec?: string;
  quantity: number;
  checked: boolean;
}

interface CartState {
  items: CartItem[];
  loaded: boolean;
}

type CartAction =
  | { type: "LOAD"; items: CartItem[] }
  | { type: "ADD"; item: Omit<CartItem, "checked"> }
  | { type: "REMOVE"; id: string }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "TOGGLE_CHECK"; id: string }
  | { type: "TOGGLE_ALL"; checked: boolean }
  | { type: "REMOVE_CHECKED" }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items, loaded: true };

    case "ADD": {
      const existingIdx = state.items.findIndex(
        (i) => i.id === action.item.id && i.spec === action.item.spec
      );
      if (existingIdx >= 0) {
        const updated = [...state.items];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + action.item.quantity,
        };
        return { ...state, items: updated };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, checked: true }],
      };
    }

    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i
        ),
      };

    case "TOGGLE_CHECK":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, checked: !i.checked } : i
        ),
      };

    case "TOGGLE_ALL":
      return {
        ...state,
        items: state.items.map((i) => ({ ...i, checked: action.checked })),
      };

    case "REMOVE_CHECKED":
      return { ...state, items: state.items.filter((i) => !i.checked) };

    case "CLEAR":
      return { items: [], loaded: true };

    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  checkedCount: number;
  checkedTotal: number;
  allChecked: boolean;
  addItem: (item: Omit<CartItem, "checked">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  toggleCheck: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  removeChecked: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  totalCount: 0,
  checkedCount: 0,
  checkedTotal: 0,
  allChecked: false,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  toggleCheck: () => {},
  toggleAll: () => {},
  removeChecked: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], loaded: false });
  const { isAuthenticated } = useAuth();
  const remoteCart = trpc.user.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const syncCart = trpc.user.cart.sync.useMutation();
  const [remoteReady, setRemoteReady] = React.useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const items = JSON.parse(raw) as CartItem[];
          dispatch({ type: "LOAD", items });
        } catch {
          dispatch({ type: "LOAD", items: [] });
        }
      } else {
        dispatch({ type: "LOAD", items: [] });
      }
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setRemoteReady(false);
      return;
    }
    if (!remoteCart.isSuccess) return;
    dispatch({
      type: "LOAD",
      items: (remoteCart.data as Array<{
        id: string;
        merchantId: number;
        merchantName: string;
        title: string;
        priceCents: number;
        quantity: number;
      }>).map((item) => ({
        id: item.id,
        merchantId: String(item.merchantId),
        merchantName: item.merchantName,
        name: item.title,
        imageUrl: "",
        price: item.priceCents / 100,
        quantity: item.quantity,
        checked: true,
      })),
    });
    setRemoteReady(true);
  }, [isAuthenticated, remoteCart.data, remoteCart.isSuccess]);

  // Persist to AsyncStorage on change
  useEffect(() => {
    if (state.loaded) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, state.loaded]);

  useEffect(() => {
    if (!isAuthenticated || !remoteReady || !state.loaded) return;
    void syncCart
      .mutateAsync({
        items: state.items.map((item) => ({
          merchantId: Number(item.merchantId),
          title: item.spec ? `${item.name}（${item.spec}）` : item.name,
          priceCents: Math.round(item.price * 100),
          quantity: item.quantity,
        })),
      })
      .catch(() => undefined);
  }, [isAuthenticated, remoteReady, state.items, state.loaded, syncCart]);

  const totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const checkedItems = state.items.filter((i) => i.checked);
  const checkedCount = checkedItems.reduce((sum, i) => sum + i.quantity, 0);
  const checkedTotal = checkedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const allChecked = state.items.length > 0 && state.items.every((i) => i.checked);

  const addItem = useCallback((item: Omit<CartItem, "checked">) => {
    dispatch({ type: "ADD", item });
  }, []);
  const removeItem = useCallback((id: string) => dispatch({ type: "REMOVE", id }), []);
  const updateQty = useCallback(
    (id: string, quantity: number) => dispatch({ type: "UPDATE_QTY", id, quantity }),
    []
  );
  const toggleCheck = useCallback((id: string) => dispatch({ type: "TOGGLE_CHECK", id }), []);
  const toggleAll = useCallback((checked: boolean) => dispatch({ type: "TOGGLE_ALL", checked }), []);
  const removeChecked = useCallback(() => dispatch({ type: "REMOVE_CHECKED" }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalCount,
        checkedCount,
        checkedTotal,
        allChecked,
        addItem,
        removeItem,
        updateQty,
        toggleCheck,
        toggleAll,
        removeChecked,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
