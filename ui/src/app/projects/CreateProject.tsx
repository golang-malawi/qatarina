import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  useToast
} from "@chakra-ui/react";
import { useForm } from '@tanstack/react-form';
import axios from 'axios';

import { useNavigate } from "react-router";

// interface newProjectRequest = {
//   name: string;
//   description: string;
//   version: string;
//   github_url: string;
//   website_url: string;
// }

export default function CreateProject() {
  const redirect = useNavigate();
  const toast = useToast();

  async function handleSubmit(e: { name: any; description: any; version: any; website_url: any; }) {
    const res = await axios.post('http://localhost:4597/v1/projects', {
      name: e.name,
      description: e.description,
      version: e.version,
      website_url: e.website_url,
    })

    if (res.status == 200) {
      toast({
        title: 'Project created.',
        description: "We've created your Project.",
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
      redirect('/projects')
    }

    return false;
  }

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      version: '',
      website_url: '',
    },
    onSubmit: async ({ value }) => {
      return handleSubmit(value);
    }
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
        name="name"
        children={(field) => (
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input type='text' value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)} />
            <FormHelperText>Project title</FormHelperText>
          </FormControl>
        )}
      />


      <form.Field
        name="description"
        children={(field) => (
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input type='text' value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)} />
            <FormHelperText>Description</FormHelperText>
          </FormControl>
        )}
      />

      <form.Field
        name="version"
        children={(field) => (
          <FormControl>
            <FormLabel>Project Version</FormLabel>
            <Input type='text' value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)} />
            <FormHelperText>Project Version</FormHelperText>
          </FormControl>
        )}
      />

      <form.Field
        name="website_url"
        children={(field) => (
          <FormControl>
            <FormLabel>Website URL</FormLabel>
            <Input type='text' value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)} />
            <FormHelperText>Website URL</FormHelperText>
          </FormControl>
        )}
      />


      <Button type='submit'>Submit</Button>
    </form>
  )
}