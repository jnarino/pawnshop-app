import { CashDrawerDetailWithSummaryResponseDto } from "@/app/core/dto/CashDrawerReportDto";
import { format } from "date-fns";

interface DailyReportPrintableProps {
    data: CashDrawerDetailWithSummaryResponseDto;
    dateRange: { from: string; to: string };
}

export const DailyReportPrintable = ({ data, dateRange }: DailyReportPrintableProps) => {
    const { transactions, salesSummary, cashAdded, pawnsBuys, cashOut, summary } = data;

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "MM/dd/yyyy hh:mm:ss a");
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const displayDateLine = dateRange.from === dateRange.to
        ? format(new Date(dateRange.from), "MM/dd/yyyy")
        : `${format(new Date(dateRange.from), "MM/dd/yyyy")} to ${format(new Date(dateRange.to), "MM/dd/yyyy")}`;

    return (
        <div className="bg-white p-8 text-[11px] font-mono text-black print:p-4 leading-tight w-full max-w-[8.5in] mx-auto overflow-auto h-full">
            <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
          }
        }
        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }
        .summary-box {
          border: 1px solid #000;
          padding: 4px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .table-header {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          font-weight: bold;
          padding: 4px 0;
          margin-top: 10px;
        }
        .transaction-row {
          border-bottom: 1px solid #eee;
          padding: 4px 0;
        }
        .bold { font-weight: bold; }
        .text-right { text-align: right; }
      `}</style>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="text-sm bold">Main Cash Drawer Detail</div>
                    <div>From {displayDateLine}</div>
                    <div className="mt-4">Date: {format(new Date(), "MM/dd/yyyy hh:mm:ss a")}</div>
                </div>
                <div className="text-right">
                    <div className="bold">LARRY'S ESTATE JEWELRY & PAWN</div>
                    <div>3316 CLEVELAND AVE.</div>
                    <div>FORT MYERS, FL 33901</div>
                    <div>(239) 939-3633</div>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="w-full">
                <div className="table-header grid grid-cols-[1.5in_0.8in_0.5in_0.5in_2in_0.8in_1.2in_0.8in] gap-2 uppercase">
                    <div>Date & Time</div>
                    <div>Ticket #</div>
                    <div>Cust #</div>
                    <div>Emp</div>
                    <div>Transaction Type</div>
                    <div className="text-right">Amount</div>
                    <div>Remarks</div>
                    <div className="text-right">Balance</div>
                </div>

                {/* Starting Balance Row from image */}
                <div className="py-1 flex justify-end pr-2">
                    <span className="bold">Balance:</span>
                    <span className="w-20 text-right">{formatCurrency(summary.startingBalance)}</span>
                </div>

                {transactions.map((tx, idx) => (
                    <div key={idx} className="transaction-row grid grid-cols-[1.5in_0.8in_0.5in_0.5in_2in_0.8in_1.2in_0.8in] gap-2 items-start">
                        <div className="flex flex-col">
                            <div>{formatDate(tx.dateTime)}</div>
                            <div className="bold uppercase">{tx.paymentMethod}</div>
                        </div>
                        <div>{tx.ticketNumber || ""}</div>
                        <div>{tx.customerNumber || ""}</div>
                        <div>{tx.employee}</div>
                        <div className="uppercase">{tx.transactionType}</div>
                        <div className="text-right flex flex-col">
                            <span>{formatCurrency(tx.amount)}</span>
                            {tx.tenderChange > 0 && <span>Change: {formatCurrency(tx.tenderChange)}</span>}
                        </div>
                        <div className="uppercase">{tx.remarks || ""}</div>
                        <div className="text-right">{formatCurrency(tx.balance)}</div>
                    </div>
                ))}
            </div>

            {/* Summary Section */}
            <div className="report-grid mt-6">
                {/* Sales Box */}
                <div className="summary-box">
                    <div className="summary-row"><span className="bold">Sales:</span> <span>{formatCurrency(salesSummary.sales)}</span></div>
                    <div className="summary-row"><span>Credit Sales:</span> <span>{formatCurrency(salesSummary.creditSales)}</span></div>
                    <div className="summary-row"><span>Layaways:</span> <span>{formatCurrency(salesSummary.layaways)}</span></div>
                    <div className="summary-row"><span>Repairs:</span> <span>{formatCurrency(salesSummary.repairs)}</span></div>
                    <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Sales:</span> <span className="bold">{formatCurrency(salesSummary.totalSales)}</span></div>

                    <div className="mt-4">
                        <div className="summary-row"><span className="bold">Cash Added:</span> <span>{formatCurrency(cashAdded.cashAdded)}</span></div>
                        <div className="summary-row"><span>Cash Added From Bank:</span> <span>{formatCurrency(cashAdded.cashAddedFromBank)}</span></div>
                        <div className="summary-row"><span>From Employee Drawers:</span> <span>{formatCurrency(cashAdded.fromEmployeeDrawers)}</span></div>
                        <div className="summary-row"><span>From Main Drawer:</span> <span>{formatCurrency(cashAdded.fromMainDrawer)}</span></div>
                        <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Cash Added:</span> <span className="bold">{formatCurrency(cashAdded.totalCashAdded)}</span></div>
                    </div>
                </div>

                {/* Pawns/Buys Box */}
                <div className="summary-box">
                    <div className="summary-row"><span className="bold">Buys:</span> <span>{formatCurrency(pawnsBuys.buys)}</span></div>
                    <div className="summary-row"><span>Pawns:</span> <span>{formatCurrency(pawnsBuys.pawns)}</span></div>
                    <div className="summary-row"><span>Pawn Payments:</span> <span>{formatCurrency(pawnsBuys.pawnPayments)}</span></div>
                    <div className="summary-row"><span>Pawn Redeems:</span> <span>{formatCurrency(pawnsBuys.pawnRedeems)}</span></div>
                    <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Pawns/Buys:</span> <span className="bold">{formatCurrency(pawnsBuys.totalPawnsBuys)}</span></div>

                    <div className="mt-4">
                        <div className="summary-row"><span className="bold">Cash Removed:</span> <span>{formatCurrency(cashOut.cashRemoved)}</span></div>
                        <div className="summary-row"><span>Deposit to Bank:</span> <span>{formatCurrency(cashOut.depositToBank)}</span></div>
                        <div className="summary-row"><span>To Employee Drawers:</span> <span>{formatCurrency(cashOut.toEmployeeDrawers)}</span></div>
                        <div className="summary-row"><span>To Main Drawer:</span> <span>{formatCurrency(cashOut.toMainDrawer)}</span></div>
                        <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Cash Out:</span> <span className="bold">{formatCurrency(cashOut.totalCashOut)}</span></div>
                    </div>
                </div>

                {/* Global Summary Box */}
                <div className="summary-box">
                    <div className="summary-row"><span className="bold">Starting Balance:</span> <span>{formatCurrency(summary.startingBalance)}</span></div>
                    <div className="summary-row"><span>Total Sales:</span> <span>{formatCurrency(summary.totalSales)}</span></div>
                    <div className="summary-row"><span>Total Pawns/Buys:</span> <span>{formatCurrency(summary.totalPawnsBuys)}</span></div>
                    <div className="summary-row"><span>Total Cash Added:</span> <span>{formatCurrency(summary.totalCashAdded)}</span></div>
                    <div className="summary-row"><span>Total Cash Out:</span> <span>{formatCurrency(summary.totalCashOut)}</span></div>
                    <div className="summary-row"><span>Customer Credits:</span> <span>{formatCurrency(summary.customerCredits)}</span></div>
                    <div className="summary-row"><span>Cash Over/Short:</span> <span>{formatCurrency(summary.cashOverShort)}</span></div>
                    <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Ending Balance:</span> <span className="bold">{formatCurrency(summary.endingBalance)}</span></div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-between">
                <div>Page: 1</div>
                <div className="uppercase">LARRY'S ESTATE JEWELRY & PAWN</div>
            </div>
        </div>
    );
};
