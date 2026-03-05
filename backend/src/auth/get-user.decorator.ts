import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        // Assuming auth-guard already populated req.user.tenant_id
        return request.user?.tenant_id || 'demo-tenant-id';
    },
);

export const GetUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user || { id: 'demo-user-id', tenant_id: 'demo-tenant-id', role: 'OWNER' };
    },
);
