import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (!role) {
            router.replace('/login');
        } else {
            // Role-based landing page
            switch (role.toUpperCase()) {
                case 'CRO':
                    router.replace('/dashboard');
                    break;
                case 'DOCTOR':
                    router.replace('/doctor-queue');
                    break;
                case 'NURSE':
                    router.replace('/nurse-queue');
                    break;
                case 'ADMIN':
                    router.replace('/system-health');
                    break;
                default:
                    router.replace('/dashboard');
            }
        }
    }, [router]);
    return null;
}
