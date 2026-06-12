import { create } from "zustand";

interface UIStore {
  // Cart drawer
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Mobile nav
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;

  // Search modal
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  // Login modal
  isLoginOpen: boolean;
  loginRedirect: string | null;
  openLogin: (redirect?: string) => void;
  closeLogin: () => void;

  // Quick view modal
  quickViewProductId: string | null;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;

  // Notification panel
  isNotificationOpen: boolean;
  openNotification: () => void;
  closeNotification: () => void;
  toggleNotification: () => void;

  // Top header visibility
  showTopHeader: boolean;
  setShowTopHeader: (show: boolean) => void;

  // Point gift modal
  pointGiftModal: {
    isOpen: boolean;
    amount: number;
    description: string;
  } | null;
  openPointGiftModal: (amount: number, description: string) => void;
  closePointGiftModal: () => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIStore>((set) => ({
  // Cart drawer
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  // Mobile nav
  isMobileNavOpen: false,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),

  // Search modal
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  // Login modal
  isLoginOpen: false,
  loginRedirect: null,
  openLogin: (redirect) => set({ isLoginOpen: true, loginRedirect: redirect ?? null }),
  closeLogin: () => set({ isLoginOpen: false, loginRedirect: null }),

  // Quick view modal
  quickViewProductId: null,
  openQuickView: (productId) => set({ quickViewProductId: productId }),
  closeQuickView: () => set({ quickViewProductId: null }),

  // Notification panel
  isNotificationOpen: false,
  openNotification: () => set({ isNotificationOpen: true }),
  closeNotification: () => set({ isNotificationOpen: false }),
  toggleNotification: () => set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),

  // Top header visibility
  showTopHeader: true,
  setShowTopHeader: (show) => set({ showTopHeader: show }),

  // Point gift modal
  pointGiftModal: null,
  openPointGiftModal: (amount, description) =>
    set({ pointGiftModal: { isOpen: true, amount, description } }),
  closePointGiftModal: () => set({ pointGiftModal: null }),

  // Toast notifications
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: `toast-${Date.now()}-${Math.random()}` }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
