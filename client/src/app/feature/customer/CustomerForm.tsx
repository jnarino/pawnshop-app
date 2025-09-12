import { useState } from 'react';
import { useCustomerIdSearch, NotFoundInfo } from '../../shared/hooks/useCustomerIdSearch';
import CustomerNotFoundModal from './components/CustomerNotFoundModal';

type FormShape = {
  // personal
  firstName: string;
  middleName?: string | null;
  lastName: string;
  streetAddress?: string | null;
  city?: string | null;
  stateUs?: string | null;
  zipCode?: string | null;
  phoneNumber?: string | null;
  ssNumber?: string | null;

  // id
  idType?: string | null;
  idState?: string | null;
  idExpiration?: string | null; // ISO date
  idNumber?: string | null;
  idIssueDate?: string | null;
  idAddress?: string | null;
  idCity?: string | null;
  idZip?: string | null;

  // physical
  height?: string | null;
  weight?: string | null;
  hairColor?: string | null;
  eyeColor?: string | null;
  race?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null; // ISO date
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;
  marks?: string | null;

  // extra
  description?: string | null;
  cellPhone?: string | null;
  email?: string | null;
};

export function CustomerForm() {
  const [form, setForm] = useState<FormShape>({ firstName: '', lastName: '' });
  const [locked, setLocked] = useState(false);
  const [notFound, setNotFound] = useState<NotFoundInfo | null>(null);
  const [useIdAsAddress, setUseIdAsAddress] = useState(false);

  const { scanning, startScan, stopScan } = useCustomerIdSearch(
    (cust) => { setForm(prev => ({ ...prev, ...cust })); setLocked(true); setNotFound(null); },
    (info) => { setNotFound(info); }
  );

  const bind = (name: keyof FormShape, opts: any = {}) => ({
    value: (form[name] ?? '') as string,
    onChange: (e: any) => {
      const v = e?.target?.value ?? e;
      setForm((f) => ({ ...f, [name]: v }));
    },
    disabled: locked || !!opts.disabled
  });

  function applyFromAamva() {
    const a = notFound?.aamva;
    if (!a) return;
    setForm((prev) => ({
      ...prev,
      firstName: a.firstName ?? prev.firstName,
      middleName: a.middleName ?? prev.middleName,
      lastName: a.lastName ?? prev.lastName,
      dateOfBirth: a.dateOfBirth ?? prev.dateOfBirth,
      idNumber: a.idNumber ?? prev.idNumber,
      idIssueDate: a.issueDate ?? prev.idIssueDate,
      idExpiration: a.expirationDate ?? prev.idExpiration,
      streetAddress: a.streetAddress ?? prev.streetAddress,
      city: a.city ?? prev.city,
      stateUs: a.stateUs ?? prev.stateUs,
      zipCode: a.zipcode ?? prev.zipCode,
      sex: a.sex ?? prev.sex,
      height: a.height ?? prev.height,
      eyeColor: a.eyeColor ?? prev.eyeColor,
      hairColor: a.hairColor ?? prev.hairColor,
      birthCountry: a.country ?? prev.birthCountry,
      weight: a.weight ?? prev.weight,
    }));
    setLocked(false);
    setNotFound(null);
  }

  // keep primary address in sync with ID address when the checkbox is on
  function toggleUseIdAddress(checked: boolean) {
    setUseIdAsAddress(checked);
    if (checked) {
      setForm(prev => ({
        ...prev,
        streetAddress: prev.idAddress ?? '',
        city: prev.idCity ?? '',
        stateUs: prev.idState ?? '',
        zipCode: prev.idZip ?? ''
      }));
    }
  }

  return (
    <div className="customer-card">
      <div className="toolbar">
        <button type="button" onClick={scanning ? stopScan : startScan}>
          {scanning ? 'Stop Scan' : 'Scan ID'}
        </button>
        {locked && <button type="button" onClick={() => setLocked(false)}>Edit</button>}
      </div>

      <section className="section">
        <h3>Personal Information</h3>
        <div className="grid g2 g4@lg">
          <label>First Name<input {...bind('firstName')} /></label>
          <label>Middle Name<input {...bind('middleName')} /></label>
          <label>Last Name<input {...bind('lastName')} /></label>
          <label>DOB<input type="date" {...bind('dateOfBirth')} /></label>

          <label>Phone (primary)<input {...bind('phoneNumber')} placeholder="(555) 123-4567" /></label>
          <label>Cell Phone<input {...bind('cellPhone')} placeholder="(555) 123-4567" /></label>
          <label>Email<input type="email" {...bind('email')} /></label>
          <label>SS Number<input {...bind('ssNumber')} placeholder="###-##-####" /></label>

          <div className="col-span-2">
            <div className="checkbox-row">
              <input id="chkUseId" type="checkbox" checked={useIdAsAddress} onChange={e => toggleUseIdAddress(e.target.checked)} />
              <label htmlFor="chkUseId">Use ID address as primary address</label>
            </div>
          </div>

          <label className="col-span-2">Street Address<input {...bind('streetAddress', { disabled: useIdAsAddress })} /></label>
          <label>City<input {...bind('city', { disabled: useIdAsAddress })} /></label>
          <label>State<input maxLength={2} {...bind('stateUs', { disabled: useIdAsAddress })} /></label>
          <label>Zip<input {...bind('zipCode', { disabled: useIdAsAddress })} /></label>
        </div>
      </section>

      <section className="section">
        <h3>Government ID</h3>
        <div className="grid g2 g4@lg">
          <label>ID Type<input {...bind('idType')} placeholder="Driver License, Passport, etc." /></label>
          <label>ID Number<input {...bind('idNumber')} /></label>
          <label>Issuing State<input maxLength={2} {...bind('idState')} /></label>
          <label>Issue Date<input type="date" {...bind('idIssueDate')} /></label>
          <label>Expiration<input type="date" {...bind('idExpiration')} /></label>

          <label className="col-span-2">ID Address<input {...bind('idAddress')} /></label>
          <label>ID City<input {...bind('idCity')} /></label>
          <label>ID Zip<input {...bind('idZip')} /></label>
        </div>
      </section>

      <section className="section">
        <h3>Physical Traits & Birth</h3>
        <div className="grid g2 g4@lg">
          <label>Sex
            <select {...bind('sex')}>
              <option value=""></option><option value="M">M</option><option value="F">F</option><option value="O">Other</option>
            </select>
          </label>
          <label>Height<input {...bind('height')} placeholder={`5'11"`} /></label>
          <label>Weight<input {...bind('weight')} placeholder="lbs" /></label>
          <label>Hair Color<input {...bind('hairColor')} /></label>
          <label>Eye Color<input {...bind('eyeColor')} /></label>
          <label>Race<input {...bind('race')} /></label>

          <label>Birth City<input {...bind('birthCity')} /></label>
          <label>Birth State<input maxLength={2} {...bind('birthState')} /></label>
          <label>Birth Country<input {...bind('birthCountry')} /></label>
          <label className="col-span-2">Marks<textarea {...bind('marks')} rows={2} /></label>
        </div>
      </section>

      <section className="section">
        <h3>Notes</h3>
        <label className="block"><textarea {...bind('description')} rows={3} placeholder="Notes / description" /></label>
      </section>

      <CustomerNotFoundModal
        open={!!notFound}
        onClose={() => setNotFound(null)}
        onAddCustomer={applyFromAamva}
      />
    </div>
  );
}
