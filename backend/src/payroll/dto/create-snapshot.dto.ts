import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

export class CreatePayrollSnapshotDto {
    @IsNotEmpty()
    @IsISO8601()
    periodDate: string;

    @IsNotEmpty()
    @IsString()
    sourceType: string; // "CSV" or "XLSX"
}
