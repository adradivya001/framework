import { useState, useEffect } from 'react';
import { UserRole } from '../data/mockThreads';

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
};

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored) as { email: string; role: UserRole };
                if (parsed.role && ROLE_PROFILES[parsed.role]) {
                    setUser({ ...ROLE_PROFILES[parsed.role], email: parsed.email });
                }
            }
        } catch {
            // ignore parse errors
        }
        setIsLoading(false);
    }, []);

    const login = (email: string, role: UserRole) => {
        const userData = { email, role };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser({ ...ROLE_PROFILES[role], email });
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return { user, isLoading, login, logout };
}
