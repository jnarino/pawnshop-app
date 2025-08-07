SELECT
    id,
    first_name AS "firstName",
    middle_name AS "middleName",
    last_name AS "lastName",
    suffix,
    date_of_birth AS "dateOfBirth",
    sex,
    eye_color AS "eyeColor",
    height,
    street_address AS "streetAddress",
    city,
    us_state,
    zipcode,
    id_number AS "idNumber",
    issue_date AS "issueDate",
    expiration_date AS "expirationDate",
    issuing_state AS "issuingState",
    phone,
    email
FROM
    customers
ORDER BY
    last_name,
    first_name;