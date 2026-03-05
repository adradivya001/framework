import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        const role = localStorage.getItem('role');
        router.replace(role ? '/dashboard' : '/login');
    }, [router]);
    return null;
}
