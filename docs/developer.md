# QATARINA Developer Docs

## Setup Taskfile (Optional)

You can set up Taskfile to simplify the dev process (or you can run all commands manually)

```bash
go install github.com/go-task/task/v3/cmd/task@latest
```

You can find most of the commands you need for this project in [Taskfile.yml](../Taskfile.yml)

## Using `sqlc` for database queries

We use SQLC in the project for generating Go code from SQL for the database layer.
In order to add queries for the database layer, you will need to modify the
[`query.sql`](../query.sql) file which stores all the queries and author an SQLC
compatible query. Read on how to write queries [here](https://docs.sqlc.dev/en/latest/howto/select.html)

After modifying the `query.sql` file, you will need to run the following command
to generate the Go code for that. This will generate code in the `internal/database/dbsqlc` directory

```sh
$ sqlc generate
```

Generally, we recommend using the generated code from a Repository or Service
type rather than using the queries in API handlers and other places directly.

## Components

The system is designed to be deployed as a single binary, but has subcommands that launch different components or run commands.

```sh
# Runs the database migrations
$ qatarina migrate

# Runs the server
$ qatarina server
```

## Create new user
To create a new user after initializing for the first time you can run
```bash
qatarina user new --name="root root" --password=root --email=root@mail.com
```

## Building the Front-end

Use the following instructions to build the frontend for embedding into the final
binary built with Go.

```sh
$ cd ui

$ npm run build
```

## Changed the API structure?

If you change the API structure, these changes need to be reflected in the frontend client. We auto-generate the API client for the frontend from the OpenAPI documentation. Follow these steps to regenerate the API client:

1. Generate the OpenAPI documentation:
```bash
swag init --v3.1
```

2. Generate the API client for the frontend:
```bash
cd ui && npm run gen:api
```

## UI

### Adding Forms

Please make sure to use the project's provided DynamicForm component where possible.
The component supports the following  Field Types:

- Standard: text, email, password, number, url, tel, date, datetime-local
- Special: textarea, select, checkbox
- Custom: test-kind, feature-module, feature-module-type, custom

#### Example Usage

Basic Form
```ts
  import { DynamicForm } from "@/components/form";
  import { z } from "zod";

  const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

  const fields = [
    {
      name: "email",
      label: "Email Address",
      type: "email" as const,
      placeholder: "you@example.com",
      helperText: "We'll never share your email",
    },
    {
      name: "password",
      label: "Password",
      type: "password" as const,
      placeholder: "Enter password",
    },
  ];

  function LoginForm() {
    const handleSubmit = async (values: { email: string; password: string }) => {
      await loginUser(values);
    };

    return (
      <DynamicForm
        schema={schema}
        fields={fields}
        onSubmit={handleSubmit}
        submitText="Login"
      />
    );
  }
```

Form with Custom Components

```ts
  const testCaseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    kind: z.string().min(1, "Test kind is required"),
    feature_or_module: z.string().min(1, "Feature is required"),
  });

  const fields = (projectId: string) => [
    {
      name: "title",
      label: "Test Case Title",
      type: "text" as const,
    },
    {
      name: "kind",
      label: "Test Kind",
      type: "custom",
      customComponent: () => <CustomeComponet1 />
    }
  ];
```

Form with Select Options

```ts
  const schema = z.object({
    category: z.string().min(1),
    priority: z.coerce.number().min(1),
  });

  const fields = [
    {
      name: "category",
      label: "Category",
      type: "select" as const,
      options: [
        { value: "bug", label: "Bug" },
        { value: "feature", label: "Feature" },
        { value: "improvement", label: "Improvement" },
      ],
    },
    {
      name: "priority",
      label: "Priority",
      type: "number" as const,
      placeholder: "1 for highest priority",
    },
  ];
```

Edit Form with Default Values

```ts
  function EditForm() {
    const [defaultValues, setDefaultValues] = useState();

    useEffect(() => {
      fetchData().then(data => {
        setDefaultValues({
          name: data.name,
          type: data.type,
          priority: data.priority,
        });
      });
    }, []);

    return (
      <DynamicForm
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        onSubmit={handleUpdate}
        submitText="Save Changes"
      />
    );
  }
```

Benefits

Code Reduction

- ~60% less code per form
- Eliminated repetitive state management
- No manual error handling boilerplate

Type Safety

- Full TypeScript support with generics
- Compile-time type checking
- Autocomplete for form values

Consistency

- Unified form validation approach
- Consistent error display
- Standardised form layouts

Maintainability

- Centralised form schemas and field configs
- Reusable field configurations
- Easy to add new field types  