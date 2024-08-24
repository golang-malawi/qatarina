# Domain Model


## Projects

Projects represent the top-level concept we deal with in QATARINA.
Projects typically represent software or IT projects, so most terminology will be from Software Development
or ICT.
QATARINA is not a project management tool so we only keep minimal information about a project to identify it
and possibly link it to actual project management teams.

A Project has TestCases, will have Testers who test those cases in a Test Plan where each test is recorded as a Test Run.

## Test Cases

A test case is a description of a test to be performed on a project or a specific version or release of a project.
A test case has a title and description, and a code. A TestCase is used to create test plans.
By design, test cases are not actionable on their own - they only describe a test that CAN be performed on a project.
Actual tests for test cases are carried out by Testers in the context of a Test Plan as a Test Run.

## Test Plan

A test plan is a record of a plan to carry out tests on a project which includes one or more test cases.
A Test Plan is owned/managed by a user (aka Tester) who is responsible for closing/completing the test plan or
managing it's details including assigning test cases to testers as Test Runs.

## Test Run (aka Test)

A Test Run is an instance of a test case within some Test Plan. A Test Run represents the event where a Tester
intends or has actually tested an existing test case on a project (again, within a Plan).
Test Runs may be marked as `pending`, `complete` or `failed`. A Test Run is performed by one tester only.
Test Runs contain notes to add more context about why a test passed or failed.
