import {
    Controller, Post, Get, Body, Param, Headers,
    UnauthorizedException, BadRequestException, Logger, UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JanmasethuHandler } from './janmasethu.handler';
import { JanmasethuAssignmentService } from './janmasethu.assignment';
import { JanmasethuTakeoverService } from './janmasethu.takeover';
import { JanmasethuContextService } from './janmasethu.context';
import { JanmasethuRepository } from './janmasethu.repository';
import { JANMASETHU_DOMAIN, JanmasethuUserRole, JanmasethuUserContext } from './janmasethu.types';

@Controller('control-tower/janmasethu')
export class JanmasethuController {
    private readonly logger = new Logger(JanmasethuController.name);

    constructor(
        private readonly handler: JanmasethuHandler,
        private readonly assignmentService: JanmasethuAssignmentService,
        private readonly takeoverService: JanmasethuTakeoverService,
        private readonly contextService: JanmasethuContextService,
        private readonly repository: JanmasethuRepository,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Helper to mock auth context extraction.
     * In production, this would be a NestJS Guard/Decorator extracting from JWT.
     */
    private getUserContext(headers: Record<string, any>): JanmasethuUserContext {
        const userId = headers['x-user-id'];
        const userRole = headers['x-user-role'] as JanmasethuUserRole;

        if (!userId || !userRole) {
            throw new UnauthorizedException('Missing user context (x-user-id, x-user-role)');
        }

        return { id: userId, role: userRole };
    }

    @Post('events')
    async handleEvents(
        @Body() event: any,
        @Headers('x-internal-api-key') apiKey: string
    ) {
        const expectedKey = this.configService.get<string>('INTERNAL_API_KEY') || 'mock-key';
        if (apiKey !== expectedKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        if (event.domain !== JANMASETHU_DOMAIN) {
            throw new BadRequestException(`Mismatched domain: ${event.domain}`);
        }

        if (event.type === 'MESSAGE_CREATED') {
            await this.handler.handleMessageCreated(event);
            return { status: 'success', threadId: event.thread_id };
        }

        return { status: 'ignored' };
    }

    @Get('threads')
    async listThreads(@Headers() headers: any) {
        const user = this.getUserContext(headers);
        return this.repository.findThreads(user);
    }

    @Get('threads/:id/context')
    async getThreadContext(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        return this.contextService.getThreadContext(threadId, user);
    }

    @Post('threads/:id/assign')
    async assignThread(
        @Param('id') threadId: string,
        @Body() body: any,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        const { targetUserId, targetRole } = body;

        await this.assignmentService.assignThread(threadId, targetUserId, targetRole, user);
        return { status: 'assigned', threadId };
    }

    @Post('threads/:id/take-control')
    async takeControl(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        await this.takeoverService.takeControl(threadId, user);
        return { status: 'controlled', threadId };
    }

    @Post('threads/:id/release-control')
    async releaseControl(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        await this.takeoverService.releaseControl(threadId, user);
        return { status: 'released', threadId };
    }
}
