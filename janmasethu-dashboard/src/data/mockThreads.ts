export type Severity = 'RED' | 'YELLOW' | 'GREEN';
export type UserRole = 'CRO' | 'DOCTOR' | 'NURSE';
export type SenderType = 'USER' | 'AI' | 'HUMAN';

export interface ConversationMessage {
    sender: SenderType;
    text: string;
    timestamp: string;
}

export interface MockThread {
    id: string;
    patient: string;
    severity: Severity;
    assigned: boolean;
    owner?: UserRole | 'AI';
    assignedUser?: string;
    assignedRole?: 'DOCTOR' | 'NURSE';
    channel: string;
    createdAt: string;
    conversation: ConversationMessage[];
}

function msg(sender: SenderType, text: string, minutesAgo: number): ConversationMessage {
    return { sender, text, timestamp: new Date(Date.now() - minutesAgo * 60000).toISOString() };
}

export const STAFF_LIST = [
    { name: 'Doctor Samuel', role: 'DOCTOR' as const },
    { name: 'Doctor Anny', role: 'DOCTOR' as const },
    { name: 'Nurse Mary', role: 'NURSE' as const },
    { name: 'Nurse John', role: 'NURSE' as const },
];

export const initialMockThreads: MockThread[] = [
    {
        id: 'thread-001',
        patient: 'patient-12',
        severity: 'RED',
        assigned: false,
        owner: 'AI',
        channel: 'WHATSAPP',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        conversation: [
            msg('USER', 'Hello, I need help urgently', 15),
            msg('AI', 'Hello! I am Sakhi, your health companion. How can I help you today?', 14),
            msg('USER', 'I have severe chest pain and I cannot breathe properly', 13),
            msg('AI', 'This sounds serious. Please stay calm. Are you experiencing pain in your left arm?', 12),
            msg('USER', 'Yes! My left arm also hurts. I am very scared', 10),
            msg('AI', '⚠️ Escalating to emergency medical staff immediately. Please do not exert yourself.', 9),
        ],
    },
    {
        id: 'thread-002',
        patient: 'patient-07',
        severity: 'RED',
        assigned: false,
        owner: 'AI',
        channel: 'SMS',
        createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
        conversation: [
            msg('USER', 'My 3 month old baby is making strange sounds while breathing', 20),
            msg('AI', 'This requires immediate attention. Is the baby\'s lips or face turning blue?', 19),
            msg('USER', 'My baby is not breathing normally, please help', 18),
            msg('AI', 'Connecting you to emergency medical support immediately.', 17),
        ],
    },
    {
        id: 'thread-003',
        patient: 'patient-44',
        severity: 'YELLOW',
        assigned: false,
        owner: 'AI',
        channel: 'WHATSAPP',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        conversation: [
            msg('USER', 'Good morning. I woke up with a high fever', 60),
            msg('AI', 'I am sorry to hear that. What is your current temperature reading?', 59),
            msg('USER', 'I have had a fever since morning, temperature is 102F', 58),
            msg('AI', 'A fever of 102°F needs attention. Have you taken any medication?', 57),
            msg('USER', 'No medication. I also have a headache and body ache', 56),
        ],
    },
    {
        id: 'thread-004',
        patient: 'patient-89',
        severity: 'YELLOW',
        assigned: false,
        owner: 'AI',
        channel: 'WHATSAPP',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        conversation: [
            msg('USER', 'I have been having a terrible headache for 2 days now', 90),
            msg('AI', 'I understand. Can you describe the headache? Is it throbbing or constant?', 89),
            msg('USER', 'Severe headache for 2 days, not going away with painkillers', 88),
            msg('AI', 'Persistent headache unresponsive to medication needs clinical assessment.', 87),
        ],
    },
    {
        id: 'thread-005',
        patient: 'patient-31',
        severity: 'GREEN',
        assigned: false,
        owner: 'AI',
        channel: 'WHATSAPP',
        createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
        conversation: [
            msg('USER', 'Hello! I have a slight cold and runny nose since yesterday', 150),
            msg('AI', 'Hello! Common cold can be managed at home. Are you having fever or sore throat?', 149),
            msg('USER', 'No fever. Just runny nose and mild cough', 148),
            msg('AI', 'Stay hydrated, rest well, and take Paracetamol for any discomfort.', 147),
            msg('USER', 'What medicines should I take for a common cold?', 145),
            msg('AI', 'You can take Paracetamol 500mg, Cetirizine for runny nose, and a cough syrup. Always consult a physician.', 144),
        ],
    },
    {
        id: 'thread-006',
        patient: 'patient-55',
        severity: 'GREEN',
        assigned: false,
        owner: 'AI',
        channel: 'SMS',
        createdAt: new Date(Date.now() - 200 * 60000).toISOString(),
        conversation: [
            msg('USER', 'Doctor prescribed Amlodipine 5mg. When should I take it?', 220),
            msg('AI', 'Amlodipine is typically taken once daily. Preferably at the same time each day.', 219),
            msg('USER', 'When should I take my blood pressure medication?', 218),
            msg('AI', 'Morning is recommended for blood pressure medications for most patients.', 217),
        ],
    },
    {
        id: 'thread-007',
        patient: 'patient-23',
        severity: 'GREEN',
        assigned: false,
        owner: 'AI',
        channel: 'WHATSAPP',
        createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
        conversation: [
            msg('USER', 'I have mild lower back pain from sitting too long', 310),
            msg('AI', 'Prolonged sitting can cause lower back tension. Have you tried stretching?', 309),
            msg('USER', 'Is it safe to exercise with mild back pain?', 308),
            msg('AI', 'Yes, gentle exercises like walking or yoga are safe and beneficial for mild back pain.', 307),
        ],
    },
];

export const mockAuditLogs = [
    { id: 'log-1', action: 'THREAD_ESCALATED', threadId: 'thread-001', actor: 'Sakhi AI', details: 'Thread escalated to RED due to cardiac distress keywords detected', timestamp: new Date(Date.now() - 9 * 60000).toISOString() },
    { id: 'log-2', action: 'OWNERSHIP_SWITCH', threadId: 'thread-002', actor: 'Sakhi AI', details: 'Ownership switched to HUMAN (DOCTOR) — Emergency escalation triggered', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    { id: 'log-3', action: 'THREAD_CREATED', threadId: 'thread-003', actor: 'System', details: 'New thread initiated by patient-44 via WhatsApp channel', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: 'log-4', action: 'THREAD_ESCALATED', threadId: 'thread-004', actor: 'Sakhi AI', details: 'Thread escalated to YELLOW — Persistent symptom cycle detected by signal engine', timestamp: new Date(Date.now() - 88 * 60000).toISOString() },
    { id: 'log-5', action: 'MESSAGE_SENT', threadId: 'thread-005', actor: 'Sakhi AI', details: 'AI responded with medication guidance for common cold symptoms', timestamp: new Date(Date.now() - 144 * 60000).toISOString() },
    { id: 'log-6', action: 'THREAD_CREATED', threadId: 'thread-006', actor: 'System', details: 'New thread initiated by patient-55 via SMS channel', timestamp: new Date(Date.now() - 220 * 60000).toISOString() },
];
