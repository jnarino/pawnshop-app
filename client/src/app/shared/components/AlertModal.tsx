import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog';

interface AlertModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    message: string | null;
}

export function AlertModal({ open, onOpenChange, title = 'Alert', message }: AlertModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {message && <AlertDialogDescription>{message}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
