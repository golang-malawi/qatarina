import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  useToast,
} from '@chakra-ui/react'
import { useForm } from '@tanstack/react-form'
import UserService from '../../../../services/UserService'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/users/new')({
  component: CreateNewUser,
})

function CreateNewUser() {
  const userService = new UserService()
  const redirect = useNavigate()
  const toast = useToast()

  async function handleSubmit(e: {
    display_name?: string
    first_name: unknown
    last_name: unknown
    password: unknown
    email: unknown
  }) {
    const res = await userService.create({
      display_name: `${e.first_name} ${e.last_name}`,
      first_name: e.first_name,
      last_name: e.last_name,
      password: e.password,
      email: e.email,
    })

    if (res.status == 200) {
      toast({
        title: 'User created.',
        description: "We've created your new Team mate.",
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      redirect({ to: '/users' })
    }

    return false
  }

  const form = useForm({
    defaultValues: {
      display_name: '',
      first_name: '',
      last_name: '',
      password: '',
      email: '',
    },
    onSubmit: async ({ value }) => {
      return handleSubmit(value)
    },
  })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="first_name"
        children={(field) => (
          <FormControl>
            <FormLabel>First Name</FormLabel>
            <Input
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FormHelperText>First name of the user</FormHelperText>
          </FormControl>
        )}
      />
      <form.Field
        name="last_name"
        children={(field) => (
          <FormControl>
            <FormLabel>Last Name</FormLabel>
            <Input
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FormHelperText>Last name of the user</FormHelperText>
          </FormControl>
        )}
      />
      <form.Field
        name="email"
        children={(field) => (
          <FormControl>
            <FormLabel>E-mail</FormLabel>
            <Input
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FormHelperText>Email of the user</FormHelperText>
          </FormControl>
        )}
      />
      <form.Field
        name="password"
        children={(field) => (
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FormHelperText>Choose a password for the user</FormHelperText>
          </FormControl>
        )}
      />

      <Button type="submit">Create New</Button>
    </form>
  )
}
