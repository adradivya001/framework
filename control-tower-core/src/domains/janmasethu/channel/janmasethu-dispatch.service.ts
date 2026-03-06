import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class JanmasethuDispatchService {
    private readonly logger = new Logger(JanmasethuDispatchService.name);

    // Mock URLs - in production these would come from ConfigService
    private readonly WHATSAPP_BOT_URL = 'http://whatsapp-bot:4005/send';
    private readonly WEB_BOT_URL = 'http://web-chatbot:4006/send';

    async dispatchResponse(channel: string, userId: string, message: string) {
        this.logger.log(`Dispatching human response to ${channel} user ${userId}: ${message}`);

        try {
            if (channel === 'whatsapp') {
                await axios.post(this.WHATSAPP_BOT_URL, { userId, message });
            } else if (channel === 'web') {
                await axios.post(this.WEB_BOT_URL, { userId, message });
            }
            this.logger.log(`Successfully dispatched message to ${channel}`);
        } catch (err) {
            this.logger.error(`Failed to dispatch message to ${channel}: ${err.message}`);
            // We still return success to the Control Tower but log the failure
        }
    }
}
