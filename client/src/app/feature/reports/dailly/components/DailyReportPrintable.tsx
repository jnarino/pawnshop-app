import { CashDrawerDetailWithSummaryResponseDto } from "@/app/core/dto/CashDrawerReportDto";
import { format } from "date-fns";
import { formatDate, formatCurrency as formatMoney } from '@/lib/utils';

interface DailyReportPrintableProps {
    data: CashDrawerDetailWithSummaryResponseDto;
    dateRange: { from: string; to: string };
}

export const DailyReportPrintable = ({ data, dateRange }: DailyReportPrintableProps) => {
    const { transactions, salesSummary, cashAdded, pawnsBuys, cashOut, summary } = data;

    const displayDateLine = dateRange.from === dateRange.to
        ? formatDate(dateRange.from, true)
        : `${formatDate(dateRange.from, true)} to ${formatDate(dateRange.to, true)}`;

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
                    <span className="w-20 text-right">{formatMoney(summary.startingBalance)}</span>
                </div>

                {transactions.map((tx, idx) => (
                    <div key={idx} className="transaction-row grid grid-cols-[1.5in_0.8in_0.5in_0.5in_2in_0.8in_1.2in_0.8in] gap-2 items-start">
                        <div className="flex flex-col">
                            <div>{formatDate(tx.dateTime, true)}</div>
                            <div className="bold uppercase">{tx.paymentMethod}</div>
                        </div>
                        <div>{tx.ticketNumber || ""}</div>
                        <div>{tx.customerNumber || ""}</div>
                        <div>{tx.employee}</div>
                        <div className="uppercase">{tx.transactionType}</div>
                        <div className="text-right flex flex-col">
                            <span>{formatMoney(tx.amount)}</span>
                            {tx.tenderChange > 0 && <span>Change: {formatMoney(tx.tenderChange)}</span>}
                        </div>
                        <div className="uppercase">{tx.remarks || ""}</div>
                        <div className="text-right">{formatMoney(tx.balance)}</div>
                    </div>
                ))}
            </div>

            {/* Summary Section */}
            <div className="report-grid mt-6">
                {/* Sales Box */}
                <div className="summary-box">
                    <div className="summary-row"><span className="bold">Sales:</span> <span>{formatMoney(salesSummary.sales)}</span></div>
                    <div className="summary-row"><span>Credit Sales:</span> <span>{formatMoney(salesSummary.creditSales)}</span></div>
                    <div className="summary-row"><span>Layaways:</span> <span>{formatMoney(salesSummary.layaways)}</span></div>
                    <div className="summary-row"><span>Repairs:</span> <span>{formatMoney(salesSummary.repairs)}</span></div>
                    <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Sales:</span> <span className="bold">{formatMoney(salesSummary.totalSales)}</span></div>

                    <div className="mt-4">
                        <div className="summary-row"><span className="bold">Cash Added:</span> <span>{formatMoney(cashAdded.cashAdded)}</span></div>
                        <div className="summary-row"><span>Cash Added From Bank:</span> <span>{formatMoney(cashAdded.cashAddedFromBank)}</span></div>
                        <div className="summary-row"><span>From Employee Drawers:</span> <span>{formatMoney(cashAdded.fromEmployeeDrawers)}</span></div>
                        <div className="summary-row"><span>From Main Drawer:</span> <span>{formatMoney(cashAdded.fromMainDrawer)}</span></div>
                        <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Cash Added:</span> <span className="bold">{formatMoney(cashAdded.totalCashAdded)}</span></div>
                    </div>
                </div>

                {/* Pawns/Buys Box */}
                <div className="summary-box">
                    <div className="summary-row"><span className="bold">Buys:</span> <span>{formatMoney(pawnsBuys.buys)}</span></div>
                    <div className="summary-row"><span>Pawns:</span> <span>{formatMoney(pawnsBuys.pawns)}</span></div>
                    <div className="summary-row"><span>Pawn Payments:</span> <span>{formatMoney(pawnsBuys.pawnPayments)}</span></div>
                    <div className="summary-row"><span>Pawn Redeems:</span> <span>{formatMoney(pawnsBuys.pawnRedeems)}</span></div>
                    <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Pawns/Buys:</span> <span className="bold">{formatMoney(pawnsBuys.totalPawnsBuys)}</span></div>

                    <div className="mt-4">
                        <div className="summary-row"><span className="bold">Cash Removed:</span> <span>{formatMoney(cashOut.cashRemoved)}</span></div>
                        <div className="summary-row"><span>Deposit to Bank:</span> <span>{formatMoney(cashOut.depositToBank)}</span></div>
                        <div className="summary-row"><span>To Employee Drawers:</span> <span>{formatMoney(cashOut.toEmployeeDrawers)}</span></div>
                        <div className="summary-row"><span>To Main Drawer:</span> <span>{formatMoney(cashOut.toMainDrawer)}</span></div>
                        <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Total Cash Out:</span> <span className="bold">{formatMoney(cashOut.totalCashOut)}</span></div>
                    </div>
                </div>

                {/* Global Summary Box */}
                <div className="summary-box">
                    <div className="summary-row"><span className="bold">Starting Balance:</span> <span>{formatMoney(summary.startingBalance)}</span></div>
                    <div className="summary-row"><span>Total Sales:</span> <span>{formatMoney(summary.totalSales)}</span></div>
                    <div className="summary-row"><span>Total Pawns/Buys:</span> <span>{formatMoney(summary.totalPawnsBuys)}</span></div>
                    <div className="summary-row"><span>Total Cash Added:</span> <span>{formatMoney(summary.totalCashAdded)}</span></div>
                    <div className="summary-row"><span>Total Cash Out:</span> <span>{formatMoney(summary.totalCashOut)}</span></div>
                    <div className="summary-row"><span>Customer Credits:</span> <span>{formatMoney(summary.customerCredits)}</span></div>
                    <div className="summary-row"><span>Cash Over/Short:</span> <span>{formatMoney(summary.cashOverShort)}</span></div>
                    <div className="summary-row border-t border-black mt-1 pt-1"><span className="bold">Ending Balance:</span> <span className="bold">{formatMoney(summary.endingBalance)}</span></div>
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
