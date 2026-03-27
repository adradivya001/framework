import { api } from "./api";
import { UserRole } from "../hooks/useAuth";

export interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    error?: string;
}

export const authService = {
    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await api.post<LoginResponse>("/api/auth/login", {
                email,
                password,
            });
            return response.data;
        } catch (error: any) {
            console.error("Login service error:", error);
            if (error.response?.data) {
                return error.response.data;
            }
            throw new Error(error.message || "Login failed");
        }
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
        }
    },

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("token");
        }
        return null;
    },

    getUser() {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }
};
