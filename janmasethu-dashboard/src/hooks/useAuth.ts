import { useState, useEffect } from 'react';

export type UserRole = 'CRO' | 'DOCTOR' | 'NURSE' | 'ADMIN';

export interface AuthUser {
    email: string;
    role: UserRole;
    name: string;
    avatar: string;
}

const ROLE_PROFILES: Record<UserRole, Omit<AuthUser, 'email'>> = {
    CRO: { role: 'CRO', name: 'Dr. Adrad', avatar: 'AD' },
    DOCTOR: { role: 'DOCTOR', name: 'Dr. Samuel', avatar: 'DS' },
    NURSE: { role: 'NURSE', name: 'Nurse Mary', avatar: 'NM' },
    ADMIN: { role: 'ADMIN', name: 'System Admin', avatar: 'SA' },
};

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const stored = localStorage.getItem('user');

            if (token && stored) {
                const parsed = JSON.parse(stored) as AuthUser;
                setUser(parsed);
            }
        } catch (e) {
            console.error('Session restoration failed', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginUser = (userData: AuthUser, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userData.role);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUser(null);
    };

    return { user, isLoading, login: loginUser, logout, isAuthenticated: !!user };
}
