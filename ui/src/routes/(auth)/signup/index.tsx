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
  Link as ChakraLink,
  Card,
  Field,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { sleep } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { PasswordInput } from "@/components/ui/password-input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { toaster } from "@/components/ui/toaster";
import { SiteConfig } from "@/lib/config/site";
import { useAuth } from "@/hooks/isLoggedIn";
import { AuthError, signUp } from "@/services/AuthService";
import { SignUpFormValues, signUpSchema } from "@/data/forms/signup";

export const Route = createFileRoute("/(auth)/signup/")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: SignUpPage,
});

function SignUpPage() {
  const auth = useAuth();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      // ASSUMPTION: request keys are snake_case like the rest of the API
      // (e.g. is_draft, created_at). The generated type will flag mismatches.
      await signUp({
        firstname: data.firstName,
        lastname: data.lastName,
        // Not asked in the form; derived so the API/JWT never carries an empty name.
        display_name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
      });

      // The account exists now. Sign in through the normal auth flow so the
      // token and app state are set up in exactly one place.
      try {
        await auth.login({
          email: data.email,
          password: data.password,
          rememberMe: false,
        });
      } catch {
        toaster.success({
          title: t("signup.created", "Account created"),
          description: t("signup.please_sign_in", "Please sign in to continue."),
        });
        await navigate({ to: "/login", replace: true });
        return;
      }

      await router.invalidate();

      // Same workaround as the login page: context state needs a tick to refresh.
      await sleep(1);

      await navigate({ to: "/", replace: true });
    },
    onError: (error: unknown) => {
      console.error("Sign up failed", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not create your account. Please try again.";

      // 409 = email already registered (assumes the API maps it that way).
      if (error instanceof AuthError && error.status === 409) {
        setError("email", { message });
      }

      toaster.error({
        title: t("signup.failed", "Sign up failed"),
        description: message,
      });
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    signUpMutation.mutate(data);
  };

  return (
    <Flex minH="100vh" align="center" justify="center" p={4}>
      <Stack mx="auto" maxW="lg" w={{ base: "full", md: "md" }} py={12} px={6}>
        <Stack align="center">
          <Flex align="center" direction="row" gap={2}>
            <Logo />
            <Heading
              fontSize="3xl"
              textAlign="center"
              fontWeight="bold"
              color="fg.heading"
            >
              {SiteConfig.name}
            </Heading>
          </Flex>
          <Text fontSize="md" color="fg.muted" textAlign="center">
            {SiteConfig.subtitle}
          </Text>
        </Stack>

        <Card.Root
          bg="bg.surface"
          border="sm"
          borderColor="border.subtle"
          shadow="card"
          borderRadius="xl"
        >
          <Card.Header>
            <Card.Title>{t("create_account")}</Card.Title>
            <Card.Description>
              {t("signup_description", "Create an account to get started.")}
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack>
                <Stack direction={{ base: "column", sm: "row" }}>
                  <Field.Root invalid={!!errors.firstName}>
                    <Field.Label>{t("first_name", "First name")}</Field.Label>
                    <Input {...register("firstName")} autoComplete="given-name" />
                    <Field.ErrorText>{errors.firstName?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.lastName}>
                    <Field.Label>{t("last_name", "Last name")}</Field.Label>
                    <Input {...register("lastName")} autoComplete="family-name" />
                    <Field.ErrorText>{errors.lastName?.message}</Field.ErrorText>
                  </Field.Root>
                </Stack>

                <Field.Root invalid={!!errors.email}>
                  <Field.Label>{t("email")}</Field.Label>
                  <Input {...register("email")} type="email" autoComplete="email" />
                  <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label>{t("password")}</Field.Label>
                  <PasswordInput
                    {...register("password")}
                    autoComplete="new-password"
                  />
                  <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword}>
                  <Field.Label>
                    {t("confirm_password", "Confirm password")}
                  </Field.Label>
                  <PasswordInput
                    {...register("confirmPassword")}
                    autoComplete="new-password"
                  />
                  <Field.ErrorText>
                    {errors.confirmPassword?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Button
                  mt={4}
                  w="full"
                  colorPalette="brand"
                  type="submit"
                  loading={isSubmitting || signUpMutation.isPending}
                >
                  {t("create_account")}
                </Button>
              </Stack>
            </form>
          </Card.Body>
        </Card.Root>

        <Stack pt={2} direction="row" justifyContent="center">
          <Text>{t("already_have_account", "Already have an account?")}</Text>
          <ChakraLink color="fg.accent" asChild>
            <Link to="/login">{t("sign_in")}</Link>
          </ChakraLink>
        </Stack>

        <Stack pt={4} direction="row" justifyContent="center">
          <LanguageSwitcher />
        </Stack>
      </Stack>
    </Flex>
  );
}