import React, { useState } from 'react';

import type { Customer } from './types'; // use client type, not server
import CustomerPicker from './components/CustomerPicker';


export default function CustomerPage() {
    const [picked, setPicked] = useState<Customer | null>(null);
    return (
        <div>
            <h2>Customers</h2>
           {/* <CustomerPicker value={picked} onChange={setPicked} /> */}

        </div>
    );
}