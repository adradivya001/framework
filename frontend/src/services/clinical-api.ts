import axios from 'axios';
import { UserRole } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// MASTER CLINICIAN CLIENT
// This client automatically injects the HIPAA-required x-user headers
export const clinicalClient = axios.create({
    baseURL: API_BASE_URL,
});

// For prototyping, we use a default clinician context.
// In production, this would be retrieved from a session/auth cookie.
clinicalClient.interceptors.request.use((config) => {
    config.headers['x-user-id'] = 'd4c8-4e5a-8b9a-1c2d3e4f5g6h'; // Mock Doctor ID
    config.headers['x-user-role'] = UserRole.DOCTOR;
    return config;
});

export const analyticsService = {
    getDashboard: async () => {
        const { data } = await clinicalClient.get('/janmasethu/analytics/dashboard');
        return data;
    },
};

export const vitalsService = {
    getPatientVitals: async (patientId: string) => {
        const { data } = await clinicalClient.get(`/vitals/${patientId}`);
        return data.data;
    },
    addVital: async (payload: any) => {
        const { data } = await clinicalClient.post('/vitals', payload);
        return data;
    },
};

export const threadsService = {
    getActiveThreads: async () => {
        const { data } = await clinicalClient.get('/janmasethu/threads');
        return data;
    },
    takeControl: async (threadId: string) => {
        const { data } = await clinicalClient.post(`/janmasethu/take-control/${threadId}`);
        return data;
    },
    referCase: async (threadId: string, doctorId: string) => {
        const { data } = await clinicalClient.post(`/janmasethu/refer/${threadId}`, { doctor_id: doctorId });
        return data;
    },
};
