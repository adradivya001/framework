export enum JanmasethuUserRole {
    CRO = 'CRO',
    DOCTOR = 'DOCTOR',
    NURSE = 'NURSE',
}

export enum JanmasethuPermission {
    VIEW_THREAD = 'VIEW_THREAD',
    ASSIGN_THREAD = 'ASSIGN_THREAD',
    TAKE_CONTROL = 'TAKE_CONTROL',
    REPLY = 'REPLY',
    OVERRIDE_SLA = 'OVERRIDE_SLA',
}

export interface JanmasethuUserContext {
    id: string;
    role: JanmasethuUserRole;
}

export enum JanmasethuRole {
    DOCTOR_QUEUE = 'DOCTOR_QUEUE',
    NURSE_QUEUE = 'NURSE_QUEUE',
}

export const JANMASETHU_DOMAIN = 'janmasethu';

export interface JanmasethuEscalationRule {
    status: 'green' | 'yellow' | 'red';
    targetRole?: JanmasethuRole;
    ownership: 'AI' | 'HUMAN';
}

export const ESCALATION_RULES: Record<string, JanmasethuEscalationRule> = {
    red: { status: 'red', targetRole: JanmasethuRole.DOCTOR_QUEUE, ownership: 'HUMAN' },
    yellow: { status: 'yellow', targetRole: JanmasethuRole.NURSE_QUEUE, ownership: 'HUMAN' },
    green: { status: 'green', ownership: 'AI' },
};
