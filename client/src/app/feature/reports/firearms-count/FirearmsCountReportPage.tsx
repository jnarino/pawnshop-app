import { CancelButton } from "@/app/shared/components/CancelButton";
import { FieldSet } from "@/components/ui/field";
import { useState } from "react";
import { Button } from '@/components/ui/button';
import { reportsApi } from "@/app/core/api/reportsApi";
import { Printer, Download, Loader2 } from "lucide-react";
import { generateFirearmsCountPdf } from "./generateFirearmsCountPdf";
import { AlertModal } from '@/app/shared/components/AlertModal';

export const FirearmsCountReportPage = () => {
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setPdfUrl(null);
        try {
            const data = await reportsApi.firearmsCountReport();

            if (!data) {
                setAlertMessage("No report data found.");
                return;
            }

            const pdfBlob = await generateFirearmsCountPdf(data);
            const url = window.URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

        } catch (error) {
            console.error(error);
            setAlertMessage('An error occurred while generating the report.');
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
        link.setAttribute(
            'download',
            `FirearmsCountReport.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] pt-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold">Firearms Count Report</h1>
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

            <FieldSet className="card section space-y-4">
                <div className="flex justify-center p-4">
                    <Button onClick={handleGenerate} disabled={loading} className="w-full max-w-sm">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Generate Report
                    </Button>
                </div>
            </FieldSet>

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
                    <div className="text-lg font-medium">Ready to Generate</div>
                    <div className="text-sm">Click generate to view the firearms count report</div>
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