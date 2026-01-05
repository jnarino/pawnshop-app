export type CashDrawerDetailResponseDto = {
    dateTime: string;
    ticketNumber: string | null;
    employee: string;
    transactionType: string;
    amount: number;
    tenderChange: number;
    remarks: string | null;
    paymentMethod: string;
    balance: number;
    customerNumber?: string; // Derived from image but not explicitly in provided JSON example, though images show "Cust #"
};

export type CashDrawerSalesDto = {
    sales: number;
    creditSales: number;
    layaways: number;
    repairs: number;
    totalSales: number;
};

export type CashDrawerCashAddedDto = {
    cashAdded: number;
    cashAddedFromBank: number;
    fromEmployeeDrawers: number;
    fromMainDrawer: number;
    totalCashAdded: number;
};

export type CashDrawerPawnsBuysDto = {
    buys: number;
    pawns: number;
    pawnPayments: number;
    pawnRedeems: number;
    totalPawnsBuys: number;
};

export type CashDrawerCashOutDto = {
    cashRemoved: number;
    depositToBank: number;
    toEmployeeDrawers: number;
    toMainDrawer: number;
    totalCashOut: number;
};

export type CashDrawerSummaryDto = {
    startingBalance: number;
    totalSales: number;
    totalPawnsBuys: number;
    totalCashAdded: number;
    totalCashOut: number;
    customerCredits: number;
    cashOverShort: number;
    endingBalance: number;
};

export type CashDrawerDetailWithSummaryResponseDto = {
    transactions: CashDrawerDetailResponseDto[];
    salesSummary: CashDrawerSalesDto;
    cashAdded: CashDrawerCashAddedDto;
    pawnsBuys: CashDrawerPawnsBuysDto;
    cashOut: CashDrawerCashOutDto;
    summary: CashDrawerSummaryDto;
};
