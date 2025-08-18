export interface Customer {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    dateOfBirth: string;
    sex: string;
    eyeColor: string;
    height: string;
    streetAddress: string;
    city: string;
    stateUs: string;
    zipcode: string;
    idNumber: string;
    ssNumber?: string; // maps to ss_number
    issueDate: string;
    expirationDate: string;
    issuingState: string;
    phone: string;
    email: string;
}