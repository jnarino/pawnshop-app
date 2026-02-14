import { CancelButton } from "@/app/shared/components/CancelButton";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from '@/components/ui/button';
import { RangeDatePicker } from "@/components/ui/range-date-picker";
import { reportsApi, TaxSalesReportData } from "@/app/core/api/reportsApi";
import { Loader2, Printer, Download } from "lucide-react";
import { generateTaxSalesPdf } from "./generateTaxSalesPdf";
import { AlertModal } from '@/app/shared/components/AlertModal';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const reportOptions = [
    { label: 'All information', value: 'all' },
    { label: 'Totals only', value: 'totals' }
];

export const TaxSalesReportPage = () => {
    const now = new Date();
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const defaultFrom = formatDate(firstDayPrevMonth);
    const defaultTo = formatDate(lastDayPrevMonth);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            dateRange: {
                from: defaultFrom,
                to: defaultTo
            },
            reportType: 'all'
        }
    });

    const submit = async (data: { dateRange: { from: string; to: string }, reportType: string }) => {
        setLoading(true);
        setPdfUrl(null);
        try {
            const { from, to } = data.dateRange;
            if (from && to) {
                const onlyTotals = data.reportType === 'totals';
                const result = await reportsApi.taxSalesReport({
                    from: new Date(from).toISOString(),
                    to: new Date(to).toISOString(),
                    onlyTotals
                }) as TaxSalesReportData;

                if (!result || !result.rows || (result.rows.length === 0 && !result.totals)) {
                    // Check if rows are empty AND totals are missing, though totals usually exist
                    if (!result.totals) {
                        setAlertMessage("No report records found.");
                        return;
                    }
                }

                const pdfBlob = await generateTaxSalesPdf(result, { from, to }, onlyTotals);
                const url = window.URL.createObjectURL(pdfBlob);
                setPdfUrl(url);

            } else {
                setAlertMessage('Please select a date range.');
            }
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setAlertMessage(error.message);
            } else {
                setAlertMessage('An error occurred while generating the report.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const iframe = document.getElementById('report-frame') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        const { from, to } = form.getValues().dateRange;
        link.setAttribute(
            'download',
            `TaxSalesReport_${from.split('T')[0]}_${to.split('T')[0]}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] pt-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold">Tax Sales Report</h1>
                <div className="flex items-center gap-2">
                    {pdfUrl && (
                        <>
                            <Button onClick={handlePrint} variant="outline" size="sm">
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button onClick={handleDownload} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </>
                    )}
                    <CancelButton />
                </div>
            </div>

            <form onSubmit={form.handleSubmit(submit)} className="">
                <FieldSet className="card section space-y-4">
                    <div>
                        <FieldLegend className="mb-2 text-sm">Select Report Type</FieldLegend>
                        <Controller
                            control={form.control}
                            name="reportType"
                            render={({ field }) => (
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-row space-x-4"
                                >
                                    {reportOptions.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option.value} id={option.value} />
                                            <Label htmlFor={option.value}>{option.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        />
                    </div>

                    <div>
                        <FieldLegend className="mb-2 text-sm">Select a date range</FieldLegend>
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
                                Generate Preview
                            </Button>
                        </div>
                    </div>
                </FieldSet>
            </form>

            {pdfUrl ? (
                <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                        id="report-frame"
                        src={pdfUrl}
                        className="w-full h-full"
                        title="Report Preview"
                    />
                </div>
            ) : (
                <div className="flex-1 border rounded-lg bg-muted/30 shadow-inner p-4 flex items-center justify-center text-muted-foreground flex-col gap-2">
                    <div className="text-lg font-medium">No report generated</div>
                    <div className="text-sm">Select a date range and click generate to view the report preview</div>
                </div>
            )}
            <AlertModal
                open={!!alertMessage}
                onOpenChange={(open) => !open && setAlertMessage(null)}
                message={alertMessage}
            />
        </div>
    );
};