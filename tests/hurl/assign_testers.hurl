POST http://localhost:4597/v1/auth/login
{
    "email": "zikani1@example.com",
    "password": "zikani123"
}
HTTP 200
[Captures]
token: jsonpath "$.token"

POST http://localhost:4597/v1/projects/4/testers
Content-Type: application/json
Authorization: Bearer {{token}}
{
    "project_id": 4,
    "testers": [
    { "user_id": 3, "role": "lead" },
    { "user_id": 4, "role": "engineer" }
    ]
}
