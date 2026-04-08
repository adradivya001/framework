export enum UserRole {
    DOCTOR = 'DOCTOR',
    NURSE = 'NURSE',
    CRO = 'CRO'
}

export interface UserContext {
    id: string;
    role: UserRole;
}

export interface PatientProfile {
    id: string;
    name_encrypted?: string;
    phone_encrypted?: string;
    age?: number;
    last_consultation?: string;
    risk_score: 'GREEN' | 'YELLOW' | 'RED';
}

export interface Thread {
    id: string;
    patient_id: string;
    status: 'PENDING' | 'ACTIVE' | 'CLOSED';
    severity: 'GREEN' | 'YELLOW' | 'RED';
    ownership_type: 'AI' | 'HUMAN';
    last_message?: string;
    updated_at: string;
}

export interface AnalyticsSummary {
    risk_distribution: {
        RED: number;
        YELLOW: number;
        GREEN: number;
    };
    sla_stats: {
        avg_response_time_min: number;
        breach_count: number;
        total_active_threads: number;
    };
    clinician_load: Record<string, number>;
}

export interface VitalRecord {
    id: string;
    vital_type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'blood_sugar';
    value: string;
    recorded_at: string;
}
