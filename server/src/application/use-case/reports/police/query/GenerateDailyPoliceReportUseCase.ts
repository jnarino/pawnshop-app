import { PoliceReportRepository, FindPoliceReportsCriteria } from '../../../../../domains/reports/police/PoliceReportRepository';
import { NotFoundError } from '../../../../common/errors';
import { GenerateDailyPoliceReportRequestDto, generateDailyPoliceReportRequestSchema } from '../../../../dto/reports/police/query/GenerateDailyPoliceReportRequestDto';
import { PoliceReportFixedWidthService } from '../../../../service/reports/PoliceReportFixedWidthService';

export type DailyPoliceReportResult = {
    content: string;
    fileName: string;
    count: number;
    startDate: string;
    endDate: string;
};

export class GenerateDailyPoliceReportUseCase {
    constructor(
        private readonly policeReportRepo: PoliceReportRepository,
        private readonly fixedWidthService: PoliceReportFixedWidthService,
    ) { }

    async execute(input: unknown): Promise<DailyPoliceReportResult> {
        const dto: GenerateDailyPoliceReportRequestDto = generateDailyPoliceReportRequestSchema.parse(input);

        const { start, end } = this.resolveDateRange(dto.startDate, dto.endDate);

        const criteria: FindPoliceReportsCriteria = {
            startDate: start,
            endDate: end,
        };

        const reports = await this.policeReportRepo.findByCriteria(criteria);

        if (!reports.length) {
            throw new NotFoundError('No transactions found for the selected date range');
        }

        const content = this.fixedWidthService.toFixedWidth(reports);
        const fileName = 'POLICE.EXP';

        return {
            content,
            fileName,
            count: reports.length,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };
    }

    private resolveDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : this.startOfDay(new Date());
            const end = endDate ? new Date(endDate) : this.endOfDay(new Date(start));
            return { start: this.startOfDay(start), end: this.endOfDay(end) };
        }

        const today = new Date();
        return { start: this.startOfDay(today), end: this.endOfDay(today) };
    }

    private startOfDay(date: Date): Date {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private endOfDay(date: Date): Date {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear().toString().padStart(4, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }
}
