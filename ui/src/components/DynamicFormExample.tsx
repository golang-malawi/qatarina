import React, { useState } from 'react';
import { z } from 'zod';
import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import { DynamicForm, createFieldConfig, createSelectOptions } from './DynamicForm';
import { toaster } from './ui/toaster';

// Example 1: User Registration Form
const userRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.string().min(1, 'Please select a role'),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const userRegistrationFields = [
  createFieldConfig('firstName', 'First Name', 'text', {
    placeholder: 'Enter your first name',
    helperText: 'Your first name as it appears on official documents',
  }),
  createFieldConfig('lastName', 'Last Name', 'text', {
    placeholder: 'Enter your last name',
    helperText: 'Your last name as it appears on official documents',
  }),
  createFieldConfig('email', 'Email Address', 'email', {
    placeholder: 'Enter your email address',
    helperText: 'We will use this for account notifications',
  }),
  createFieldConfig('password', 'Password', 'password', {
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters long',
  }),
  createFieldConfig('confirmPassword', 'Confirm Password', 'password', {
    placeholder: 'Confirm your password',
    helperText: 'Please enter the same password again',
  }),
  createFieldConfig('role', 'Role', 'select', {
    placeholder: 'Select your role',
    helperText: 'Choose the role that best describes your position',
    options: createSelectOptions([
      { value: 'admin', label: 'Administrator' },
      { value: 'manager', label: 'Manager' },
      { value: 'tester', label: 'Tester' },
      { value: 'developer', label: 'Developer' },
    ]),
  }),
  createFieldConfig('agreeToTerms', 'I agree to the terms and conditions', 'checkbox', {
    helperText: 'You must agree to continue',
  }),
];

// Example 2: Project Creation Form
const projectCreationSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Must be a valid GitHub URL').optional().or(z.literal('')),
  category: z.string().min(1, 'Please select a category'),
});

const projectCreationFields = [
  createFieldConfig('name', 'Project Name', 'text', {
    placeholder: 'Enter project name',
    helperText: 'Choose a descriptive name for your project',
  }),
  createFieldConfig('description', 'Description', 'textarea', {
    placeholder: 'Describe your project',
    helperText: 'Provide a detailed description of your project',
  }),
  createFieldConfig('version', 'Version', 'text', {
    placeholder: '1.0.0',
    helperText: 'Use semantic versioning (e.g., 1.0.0)',
  }),
  createFieldConfig('websiteUrl', 'Website URL', 'url', {
    placeholder: 'https://example.com',
    helperText: 'Optional: Your project website',
  }),
  createFieldConfig('githubUrl', 'GitHub URL', 'url', {
    placeholder: 'https://github.com/username/repo',
    helperText: 'Optional: Your GitHub repository',
  }),
  createFieldConfig('category', 'Category', 'select', {
    placeholder: 'Select a category',
    helperText: 'Choose the most appropriate category',
    options: createSelectOptions([
      { value: 'web', label: 'Web Application' },
      { value: 'mobile', label: 'Mobile Application' },
      { value: 'desktop', label: 'Desktop Application' },
      { value: 'api', label: 'API/Backend' },
      { value: 'other', label: 'Other' },
    ]),
  }),
];

// Example 3: Contact Form (Horizontal Layout)
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

const contactFormFields = [
  createFieldConfig('name', 'Full Name', 'text', {
    placeholder: 'Enter your full name',
  }),
  createFieldConfig('email', 'Email', 'email', {
    placeholder: 'Enter your email',
  }),
  createFieldConfig('phone', 'Phone Number', 'tel', {
    placeholder: 'Enter your phone number',
    helperText: 'Optional',
  }),
  createFieldConfig('subject', 'Subject', 'text', {
    placeholder: 'Enter message subject',
  }),
  createFieldConfig('message', 'Message', 'textarea', {
    placeholder: 'Enter your message',
    helperText: 'Please provide detailed information',
  }),
];

export function DynamicFormExamples() {
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleUserRegistration = async (values: z.infer<typeof userRegistrationSchema>) => {
    setUserSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toaster.create({
        title: 'User registered successfully!',
        description: `Welcome ${values.firstName} ${values.lastName}!`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Registration failed',
        description: 'Please try again later',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleProjectCreation = async (values: z.infer<typeof projectCreationSchema>) => {
    setProjectSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toaster.create({
        title: 'Project created successfully!',
        description: `Project "${values.name}" has been created.`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Project creation failed',
        description: 'Please try again later',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setProjectSubmitting(false);
    }
  };

  const handleContactForm = async (values: z.infer<typeof contactFormSchema>) => {
    setContactSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toaster.create({
        title: 'Message sent successfully!',
        description: 'We will get back to you soon.',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Failed to send message',
        description: 'Please try again later',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <VStack gap={8} align="stretch" p={6}>
      <Heading size="lg">Dynamic Form Examples</Heading>
      
      {/* User Registration Form */}
      <Box>
        <Heading size="md" mb={4}>User Registration</Heading>
        <DynamicForm
          schema={userRegistrationSchema}
          fields={userRegistrationFields}
          onSubmit={handleUserRegistration}
          submitText="Register User"
          submitLoading={userSubmitting}
          layout="vertical"
          spacing={4}
        />
      </Box>

      {/* Project Creation Form */}
      <Box>
        <Heading size="md" mb={4}>Create New Project</Heading>
        <DynamicForm
          schema={projectCreationSchema}
          fields={projectCreationFields}
          onSubmit={handleProjectCreation}
          submitText="Create Project"
          submitLoading={projectSubmitting}
          layout="vertical"
          spacing={4}
        />
      </Box>

      {/* Contact Form (Horizontal Layout) */}
      <Box>
        <Heading size="md" mb={4}>Contact Us</Heading>
        <DynamicForm
          schema={contactFormSchema}
          fields={contactFormFields}
          onSubmit={handleContactForm}
          submitText="Send Message"
          submitLoading={contactSubmitting}
          layout="horizontal"
          spacing={4}
        />
      </Box>
    </VStack>
  );
} 