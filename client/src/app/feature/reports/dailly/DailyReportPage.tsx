import { CancelButton } from "@/app/shared/components/CancelButton";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from '@/components/ui/button';
import { RangeDatePicker } from "@/components/ui/range-date-picker";
import { reportsApi } from "@/app/core/api/reportsApi";
import { Loader2, Printer } from "lucide-react";
import { CashDrawerDetailWithSummaryResponseDto } from "@/app/core/dto/CashDrawerReportDto";
import { DailyReportPrintable } from "./components/DailyReportPrintable";

export const DailyReportPage = () => {
    const today = new Date();
    // Format to YYYY-MM-DD for local date
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<CashDrawerDetailWithSummaryResponseDto | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const form = useForm({
        defaultValues: {
            dateRange: {
                from: localToday,
                to: localToday
            },
        }
    });

    const submit = async (data: { dateRange: { from: string; to: string } }) => {
        setLoading(true);
        setReportData(null);
        try {
            const { from, to } = data.dateRange;
            if (from && to) {
                // Formatting dates as required: 2025-12-12T00:00:00Z
                const startDate = `${from}T00:00:00Z`;
                const endDate = `${to}T00:00:00Z`;

                const result = await reportsApi.cashDrawerDetailReport({
                    from: startDate,
                    to: endDate
                });

                if (!result || !result.transactions) {
                    alert("No daily report records found.");
                    return;
                }

                setReportData(result);
            } else {
                alert('Please select a date range.');
            }
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('An error occurred while generating the report.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!reportRef.current) return;

        const printContent = reportRef.current.innerHTML;
        const printWindow = window.open('', '_blank');

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Daily Report</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @media print {
                                body { margin: 0; padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                        <script>
                            window.onload = () => {
                                window.print();
                                window.close();
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] pt-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-foreground">Daily Cash Drawer Detail</h1>
                <div className="flex items-center gap-2">
                    {reportData && (
                        <Button onClick={handlePrint} variant="outline" size="sm">
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    )}
                    <CancelButton />
                </div>
            </div>

            <form onSubmit={form.handleSubmit(submit)} className="shrink-0">
                <FieldSet className="card section">
                    <FieldLegend className="mb-2 text-sm text-foreground/70">Select Report Date</FieldLegend>
                    <div className="flex items-end gap-2">
                        <Controller
                            control={form.control}
                            name="dateRange"
                            render={({ field }) => (
                                <RangeDatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Generate Report
                        </Button>
                    </div>
                </FieldSet>
            </form>

            <div className="flex-1 border rounded-lg overflow-hidden bg-muted/30 shadow-inner p-4 overflow-y-auto">
                {reportData ? (
                    <div ref={reportRef} className="bg-white shadow-sm mx-auto">
                        <DailyReportPrintable
                            data={reportData}
                            dateRange={form.getValues().dateRange}
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                        <div className="text-lg font-medium">No report generated</div>
                        <div className="text-sm">Select a date range and click generate to view the report preview</div>
                    </div>
                )}
            </div>
        </div>
    );
};