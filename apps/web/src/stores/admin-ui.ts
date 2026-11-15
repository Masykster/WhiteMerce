"use client";

import { create } from "zustand";
import { DEFAULT_CURRENCY, type SupportedCurrency } from "@whitemerce/shared/constants";

export interface AdminToast {
  id: string;
  title: string;
  tone: "success" | "error" | "info";
}

interface AdminUiState {
  sidebarOpen: boolean;
  displayCurrency: SupportedCurrency;
  toasts: AdminToast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setDisplayCurrency: (currency: SupportedCurrency) => void;
  pushToast: (title: string, tone?: AdminToast["tone"]) => void;
  dismissToast: (id: string) => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  sidebarOpen: false,
  displayCurrency: DEFAULT_CURRENCY,
  toasts: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
  pushToast: (title, tone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, title, tone }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 3800);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
