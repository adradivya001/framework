export enum RiskLevel {
    GREEN = 'GREEN',
    YELLOW = 'YELLOW',
    RED = 'RED',
}

export const EMERGENCY_KEYWORDS = [
    'chest pain',
    'difficulty breathing',
    'unconscious',
    'heavy bleeding',
    'heart attack',
    'severe pain',
];

export const MODERATE_KEYWORDS = [
    'fever',
    'vomiting',
    'headache',
    'stomach pain',
    'dizziness',
];

export class KeywordDetector {
    detect(text: string): RiskLevel {
        const lower = text.toLowerCase();

        const hasEmergency = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
        if (hasEmergency) return RiskLevel.RED;

        const hasModerate = MODERATE_KEYWORDS.some((kw) => lower.includes(kw));
        if (hasModerate) return RiskLevel.YELLOW;

        return RiskLevel.GREEN;
    }
}
