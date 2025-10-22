# Login and capture token
POST http://localhost:4597/v1/auth/login
Content-Type: application/json
{
  "email": "test@mail.com",
  "password": "pass123"
}
HTTP 200
[Captures]
token: jsonpath "$.token"

# Import test cases from CSV file
POST http://localhost:4597/v1/test-cases/import-file
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

[Multipart]
projectID: 2
file: file,testcases.csv; text/csv

HTTP 200
[Asserts]
jsonpath "$.message" contains "Imported"

# Import test cases from Excel file
POST http://localhost:4597/v1/test-cases/import-file
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

[Multipart]
projectID: 5
file: file,testcases.xlsx; application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

HTTP 200
[Asserts]
jsonpath "$.message" contains "Imported"

# Try importing oversized file
POST http://localhost:4597/v1/test-cases/import-file
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

[Multipart]
projectID: 2
file: file, testcases_over.csv; text/csv

HTTP 500
[Asserts]
body contains "row limit"