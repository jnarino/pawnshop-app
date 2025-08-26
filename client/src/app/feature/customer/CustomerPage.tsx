import React, { useState } from 'react';
import { CustomerPicker } from './components/CustomerPicker';
import { Customer } from '../../../../../server/src/domain/customer/Customer';


export default function CustomerPage() {
    const [picked, setPicked] = useState<Customer | null>(null);
    return (
        <div>
            <h2>Customers</h2>
            <CustomerPicker value={picked} onChange={setPicked} />
            {/* render details/edit using picked */}
        </div>
    );
}