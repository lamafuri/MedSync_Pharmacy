import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      pharmacist: null,
      token: null,
      login: (pharmacist, token) => set({ pharmacist, token }),
      logout: () => set({ pharmacist: null, token: null }),
      setPharmacist: (pharmacist) => set({ pharmacist }),
    }),
    {
      name: 'pharmacist-auth',
    }
  )
);
