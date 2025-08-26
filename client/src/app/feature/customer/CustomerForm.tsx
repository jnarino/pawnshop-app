import { useState } from 'react';
import { useCustomerIdSearch, NotFoundInfo } from '../../shared/hooks/useCustomerIdSearch';
import CustomerNotFoundModal from '../pawnTicket/components/CustomerNotFoundModal';

export function CustomerForm() {
  const [form, setForm] = useState<any>({});
  const [locked, setLocked] = useState(false);
  const [notFound, setNotFound] = useState<NotFoundInfo | null>(null);

  const { scanning, startScan, stopScan } = useCustomerIdSearch(
    (cust) => { setForm(cust); setLocked(true); setNotFound(null); },
    (info) => { setNotFound(info); }
  );

  const bind = (name: string) => ({
    value: form[name] ?? '',
    onChange: (e: any) => setForm((f: any) => ({ ...f, [name]: e.target.value })),
    disabled: locked,
  });

  function applyFromAamva() {
    const a = notFound?.aamva;
    if (!a) return;
    setForm((prev: any) => ({
      ...prev,
      firstName: a.firstName ?? prev.firstName,
      middleName: a.middleName ?? prev.middleName,
      lastName: a.lastName ?? prev.lastName,
      date_of_birth: a.dateOfBirth ?? prev.date_of_birth,
      dateOfBirth: a.dateOfBirth ?? prev.dateOfBirth,
      id_number: a.idNumber ?? prev.id_number,
      idNumber: a.idNumber ?? prev.idNumber,
      streetAddress: a.streetAddress ?? prev.streetAddress,
      city: a.city ?? prev.city,
      stateUs: a.stateUs ?? prev.stateUs,
      zipcode: a.zipcode ?? prev.zipcode,
      sex: a.sex ?? prev.sex,
      height: a.height ?? prev.height,
      eyeColor: a.eyeColor ?? prev.eyeColor,
      hairColor: a.hairColor ?? prev.hairColor,
      issueDate: a.issueDate ?? prev.issueDate,
      expirationDate: a.expirationDate ?? prev.expirationDate,
      country: a.country ?? prev.country,
      weight: a.weight ?? prev.weight,
    }));
    setLocked(false);
    setNotFound(null);
  }

  return (
    <div>
      <div className="toolbar">
        <button type="button" onClick={scanning ? stopScan : startScan}>
          {scanning ? 'Stop Scan' : 'Scan ID'}
        </button>
        {locked && <button type="button" onClick={() => setLocked(false)}>Edit</button>}
      </div>

      <label>First Name <input {...bind('firstName')} /></label>
      <label>Last Name <input {...bind('lastName')} /></label>
      <label>DOB <input type="date" {...bind('date_of_birth')} /></label>
      <label>ID Number <input {...bind('id_number')} /></label>

      <CustomerNotFoundModal
        open={!!notFound}
        onClose={() => setNotFound(null)}
        onAddCustomer={applyFromAamva}
      />
    </div>
  );
}