import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        // For MVP/Demo: If no Auth header but it's local, we can mock a user
        // However, let's try to follow JWT pattern.
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            if (process.env.NODE_ENV !== 'production') {
                // Mock user for local development demo
                request.user = { id: 'demo-user-id', tenant_id: 'demo-tenant-id', role: 'OWNER' };
                return true;
            }
            throw new UnauthorizedException('Missing auth header');
        }
        // TODO: Verify JWT with Cognito
        return true;
    }
}
