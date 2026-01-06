import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { Customer } from '@/app/feature/_shared/customer';

interface CustomerPerformanceTabProps {
  customer: Customer | null;
}

export default function CustomerPerformanceTab({ customer }: Readonly<CustomerPerformanceTabProps>) {
  
  const performanceData = [
    { label: 'Active', value: '0' },
    { label: 'Redeemed', value: '0' },
    { label: 'Buys', value: '0' },
    { label: 'Redemption Ratio', value: '0%' },
    { label: 'Default Ratio', value: '0%' },
    { label: 'Return Ratio', value: '0%' },
    { label: 'Sales Amount', value: '0%' },
  ];

  const customerName = customer 
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer'
    : 'No Customer Selected';

  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <p className="text-sm text-muted-foreground">
          This section provides a comprehensive overview of the customer's activity history with the store,
          including active loans, redemptions, purchases, and performance ratios.
        </p>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold text-lg text-center">
                {customerName}
              </TableCell>
            </TableRow>
            {performanceData.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="text-right">{item.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-center pt-4">
          <Button onClick={() => console.log('Print functionality to be implemented')}>
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
