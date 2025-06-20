POST http://localhost:4597/v1/auth/login
{
    "email": "test@mail.com",
    "password": "test123"
}
HTTP 200

POST http://localhost:4597/modules
Content-Type: application/json
{
    "projectID" : 100,
    "name" : "Test Module",
    "code" : "TM",
    "priority" : 1

}

HTTP/1.1 201

