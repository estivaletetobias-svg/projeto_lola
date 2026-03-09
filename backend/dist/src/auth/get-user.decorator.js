"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUser = exports.GetTenant = void 0;
const common_1 = require("@nestjs/common");
exports.GetTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenant_id || 'demo-tenant-id';
});
exports.GetUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || { id: 'demo-user-id', tenant_id: 'demo-tenant-id', role: 'OWNER' };
});
//# sourceMappingURL=get-user.decorator.js.map