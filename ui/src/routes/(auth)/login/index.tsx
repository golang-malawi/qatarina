import {
  redirect,
  createFileRoute,
  useRouter,
  Link,
} from "@tanstack/react-router";
import {
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Checkbox,
  Link as ChakraLink,
  Card,
  Field,
} from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/isLoggedIn";
import { sleep } from "@/lib/utils";
import { LoginFormValues, loginSchema } from "@/data/forms/login";
import { Logo } from "@/components/logo";
import { PasswordInput } from "@/components/ui/password-input";
import { SiteConfig } from "@/lib/config/site";

const fallback = "/dashboard" as const;

export const Route = createFileRoute("/(auth)/login/")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const search = Route.useSearch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Mock login mutation with react-query
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      await auth.login(data);
      await router.invalidate();

      // TODO: 🥲 dies without this sleep because the context state is not refresing in time
      await sleep(1);

      await navigate({ to: search.redirect || fallback, replace: true });
      return data;
    },
    onSuccess: (data) => {
      console.log("Login successful", data);
      // Handle successful login (e.g., redirect or set auth state)
    },
    onError: (error) => {
      console.error("Login failed", error);
      // Handle login error
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Color scheme

  return (
    <Flex minH="100vh" align="center" justify="center" p={4}>
      <Stack mx="auto" maxW="lg" w={{ sm: "full", md: "450px" }} py={12} px={6}>
        <Stack align="center">
          <Flex align="center" direction="row" gap={2}>
            <Logo />
            <Heading fontSize="3xl" textAlign="center" fontWeight="bold">
              {SiteConfig.name}
            </Heading>
          </Flex>
          <Text fontSize="md" color="gray.500" textAlign="center">
            {SiteConfig.subtitle}
          </Text>
        </Stack>

        <Card.Root>
          <Card.Header>
            <Card.Title>Welcome back</Card.Title>
            <Card.Description>
              Enter your email and password to continue.
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack>
                <Field.Root invalid={!!errors.email}>
                  <Field.Label>Email</Field.Label>
                  <Input {...register("email")} />
                  <Field.ErrorText>
                    {errors.email && errors.email.message}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label>Password</Field.Label>
                  <PasswordInput {...register("password")} />
                  <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                </Field.Root>

                <Stack
                  direction={{ base: "column", sm: "row" }}
                  align="start"
                  justify="space-between"
                  pt={2}
                >
                  <Controller
                    control={control}
                    name="rememberMe"
                    render={({ field }) => (
                      <Field.Root
                        invalid={!!errors.rememberMe}
                        disabled={field.disabled}
                      >
                        <Checkbox.Root
                          checked={field.value}
                          onCheckedChange={({ checked }) =>
                            field.onChange(checked)
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>Remember me</Checkbox.Label>
                        </Checkbox.Root>
                        <Field.ErrorText>
                          {errors.rememberMe && errors.rememberMe?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    )}
                  />
                  <ChakraLink href="#" fontSize="sm" asChild>
                    <Link to="/">Forgot password?</Link>
                  </ChakraLink>
                </Stack>

                <Button
                  mt={4}
                  w="full"
                  colorScheme="teal"
                  type="submit"
                  loading={isSubmitting || loginMutation.isPending}
                >
                  Sign in
                </Button>
              </Stack>
            </form>
          </Card.Body>
        </Card.Root>

        <Stack pt={2} direction="row" justifyContent="center">
          <Text>New to {SiteConfig.name}?</Text>
          <ChakraLink href="#">Create an account</ChakraLink>
        </Stack>
      </Stack>
    </Flex>
  );
}

