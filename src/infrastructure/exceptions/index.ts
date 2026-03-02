import { HttpException, HttpStatus } from '@nestjs/common';

export class ConcurrencyException extends HttpException {
    constructor(message: string = 'Optimistic concurrency conflict: version mismatch') {
        super({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message,
        }, HttpStatus.CONFLICT);
    }
}

export class AISuppressionException extends HttpException {
    constructor(message: string = 'AI processing suppressed: Thread is locked or owned by HUMAN') {
        super({
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message,
        }, HttpStatus.FORBIDDEN);
    }
}
