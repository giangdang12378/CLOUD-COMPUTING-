import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:4173/api/tenants" : "/api/tenants";

axios.defaults.withCredentials = true;

export const useTenantStore = create((set) => ({
    tenants: [],
    isLoading: false,
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalTenants: 0,
    },

    getTenants: async (page = 1, search = '') => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}?page=${page}&limit=10&search=${search}`);
            set({ 
                tenants: response.data.tenants, 
                pagination: response.data.pagination,
                isLoading: false 
            });
        } catch (error) {
            set({ error: error.response?.data?.message || "Error fetching tenants", isLoading: false });
        }
    },

    updateTenantStatus: async (id, isActive, lockReason = '') => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/${id}/status`, { isActive, lockReason });
            set((state) => ({
                tenants: state.tenants.map(tenant => 
                    tenant._id === id ? response.data.tenant : tenant
                ),
                isLoading: false
            }));
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || "Error updating tenant status", isLoading: false });
            throw error;
        }
    }
}));
