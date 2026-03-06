import {
    Controller, Post, Get, Body, Param, Headers,
    UnauthorizedException, BadRequestException, Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JanmasethuHandler } from './janmasethu.handler';
import { JanmasethuAssignmentService } from './janmasethu.assignment';
import { JanmasethuTakeoverService } from './janmasethu.takeover';
import { JanmasethuContextService } from './janmasethu.context';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuDispatchService } from './channel/janmasethu-dispatch.service';
import { ThreadService } from '../../kernel/thread/thread.service';
import { JANMASETHU_DOMAIN, JanmasethuUserRole, JanmasethuUserContext } from './janmasethu.types';

@Controller('janmasethu')
export class JanmasethuController {
    private readonly logger = new Logger(JanmasethuController.name);

    constructor(
        private readonly handler: JanmasethuHandler,
        private readonly assignmentService: JanmasethuAssignmentService,
        private readonly takeoverService: JanmasethuTakeoverService,
        private readonly contextService: JanmasethuContextService,
        private readonly repository: JanmasethuRepository,
        private readonly threadService: ThreadService,
        private readonly dispatchService: JanmasethuDispatchService,
        private readonly configService: ConfigService,
    ) { }

    private getUserContext(headers: Record<string, any>): JanmasethuUserContext {
        const userId = headers['x-user-id'];
        const userRole = headers['x-user-role'] as JanmasethuUserRole;

        if (!userId || !userRole) {
            throw new UnauthorizedException('Missing user context');
        }

        return { id: userId, role: userRole };
    }

    @Get('threads')
    async listThreads(@Headers() headers: any) {
        const user = this.getUserContext(headers);
        return this.repository.findThreads(user);
    }

    @Get('context/:id')
    async getThreadContext(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        return this.contextService.getThreadContext(threadId, user);
    }

    @Post('assign/:id')
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

    @Post('take-control/:id')
    async takeControl(
        @Param('id') threadId: string,
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);
        await this.takeoverService.takeControl(threadId, user);
        return { status: 'controlled', threadId };
    }

    @Post('reply')
    async handleReply(
        @Body() body: { thread_id: string; sender_type: string; content: string },
        @Headers() headers: any
    ) {
        const user = this.getUserContext(headers);

        // 1. Save message to thread
        await this.threadService.appendMessage(body.thread_id, {
            sender_id: user.id,
            sender_type: 'HUMAN',
            content: body.content,
        });

        // 2. Fetch thread to get channel and original userId
        const thread = await this.threadService.getThread(body.thread_id);

        // 3. Dispatch to external channel
        await this.dispatchService.dispatchResponse(
            thread.channel,
            thread.user_id,
            body.content
        );

        return { status: 'sent', thread_id: body.thread_id };
    }
}
