import { Injectable, Logger } from '@nestjs/common';
import { SentimentProvider } from '../../../contracts';
import { JanmasethuRepository } from '../janmasethu.repository';
import { KeywordDetector } from './keyword-detector';
import { SentimentAnalyzer } from './sentiment-analyzer';
import { ContextExtractor } from './context-extractor';
import { BertRiskAnalyzer } from './bert-risk-analyzer';
import { RiskScoringEngine } from './risk-scoring-engine';
import { RiskClassifier } from './risk-classifier';

@Injectable()
export class JanmasethuRiskService implements SentimentProvider {
    private readonly logger = new Logger(JanmasethuRiskService.name);

    // Internal modules (could be injected as providers if needed)
    private readonly keywordDetector = new KeywordDetector();
    private readonly sentimentAnalyzer = new SentimentAnalyzer();
    private readonly contextExtractor: ContextExtractor;
    private readonly bertAnalyzer = new BertRiskAnalyzer();
    private readonly scoringEngine = new RiskScoringEngine();
    private readonly classifier = new RiskClassifier();

    constructor(private readonly repository: JanmasethuRepository) {
        this.contextExtractor = new ContextExtractor(repository);
    }

    /**
     * Orchestrates the Hybrid Sentiment Detection + Risk Scoring pipeline.
     */
    async evaluate(text: string, options?: { threadId?: string }): Promise<{ score: number; label: string }> {
        this.logger.log(`JanmasethuRiskEngine: Analyzing message: "${text.substring(0, 50)}..."`);

        // 1. Keyword Detection
        const keywordLevel = this.keywordDetector.detect(text);

        // 2. Sentiment Analysis
        const sentimentScore = this.sentimentAnalyzer.analyze(text);

        // 3. BERT Risk Analysis
        const bertLevel = await this.bertAnalyzer.analyze(text);

        // 4. Context Extraction & Risk Detection
        let contextRisk = false;
        if (options?.threadId) {
            const context = await this.contextExtractor.extract(options.threadId);
            // Simple heuristic for context risk: if recent history has multiple distress markers
            const distressCount = (context.match(/help|urgent|pain|severe/gi) || []).length;
            if (distressCount >= 2) contextRisk = true;
        }

        // 5. Risk Scoring
        const finalScore = this.scoringEngine.calculateScore({
            keywordLevel,
            sentimentScore,
            bertLevel,
            contextRisk,
        });

        // 6. Severity Classification
        const riskLevel = this.classifier.classify(finalScore);

        this.logger.log(`JanmasethuRiskEngine: Result - Score: ${finalScore}, Risk: ${riskLevel}`);

        return {
            score: finalScore / 100, // Normalize if needed by kernel, though kernel uses labels
            label: riskLevel.toLowerCase(),
        };
    }
}
