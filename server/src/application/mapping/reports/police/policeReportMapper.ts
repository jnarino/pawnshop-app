import { PoliceReport } from "../../../../domains/reports/police/PoliceReport";
import { PoliceReportResponseDto, PoliceReportsListDto } from "../../../dto/reports/police/query/PoliceReportResponseDto";


export function toPoliceReportResponseDto(report: PoliceReport): PoliceReportResponseDto {
    return {
        id: report.id,
        controlNumber: report.controlNumber,

        storeName: report.storeName,
        storeAddress: report.storeAddress,
        storeCity: report.storeCity,
        storeState: report.storeState,
        storeZip: report.storeZip,
        storePhone: report.storePhone,

        transactionDate: report.transactionDate.toISOString(),
        transactionTime: report.transactionTime,
        transactionType: report.transactionType,

        customerFullName: report.getFullCustomerName(),
        customerDob: report.customerDob.toISOString(),
        customerGender: report.customerGender,
        customerAddress: report.customerAddress,
        customerCity: report.customerCity,
        customerState: report.customerState,
        customerZip: report.customerZip,
        customerPhone: report.customerPhone,
        customerEmployer: report.customerEmployer,
        customerIdType: report.customerIdType,
        customerIdNumber: report.customerIdNumber,

        customerHeight: report.customerHeight,
        customerWeight: report.customerWeight,
        customerHairColor: report.customerHairColor,
        customerEyeColor: report.customerEyeColor,

        items: [
            {
                controlNumber: report.controlNumber,
                itemType: report.itemType,
                itemBrand: report.itemBrand,
                itemDescription: report.itemDescription,
                itemQuantity: report.itemQuantity,
                itemAmount: report.itemAmount,
                itemStatus: report.itemStatus,
                recordType: report.recordType,
            },
        ],

        holdDate: report.holdDate.toISOString(),
        holdAgency: report.holdAgency,
        holdCaseNumber: report.holdCaseNumber,
        holdDateOut: report.holdDateOut ? report.holdDateOut.toISOString() : null,
        holdStatus: report.holdDateOut ? 'RELEASED' : 'ACTIVE',

        reportDate: report.reportDate.toISOString(),
        generatedAt: report.reportGeneratedAt.toISOString(),
        generatedBy: report.generatedBy,
    };
}

export function toPoliceReportListDto(
    reports: PoliceReport[],
    agency?: string,
): PoliceReportsListDto {
    return {
        totalCount: reports.length,
        reportDate: new Date().toISOString(),
        agency,
        reports: reports.map(toPoliceReportResponseDto),
    };
}
