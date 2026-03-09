"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportValidationModule = void 0;
const common_1 = require("@nestjs/common");
const storage_module_1 = require("../storage/storage.module");
const import_validation_processor_1 = require("./import-validation.processor");
let ImportValidationModule = class ImportValidationModule {
};
exports.ImportValidationModule = ImportValidationModule;
exports.ImportValidationModule = ImportValidationModule = __decorate([
    (0, common_1.Module)({
        imports: [storage_module_1.StorageModule],
        providers: [import_validation_processor_1.ImportValidationProcessor],
    })
], ImportValidationModule);
//# sourceMappingURL=import-validation.module.js.map