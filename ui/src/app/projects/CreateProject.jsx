import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    useToast
} from "@chakra-ui/react";
import axios from 'axios';
import { useState } from "react";


import { useNavigate } from "react-router";

export default function CreateProject() {
    const redirect = useNavigate();
    const toast = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [version, setVersion] = useState('');
    const [website_url, setWebsite_url] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();

        const res = await axios.post('http://localhost:4597/v1/projects', {
            name,
            description,
            version,
            website_url
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

    return (
        <form onSubmit={handleSubmit}>
            <FormControl>
                <FormLabel>Name</FormLabel>
                <Input type='text' name='name' onChange={(e) => setName(e.target.value)} />
                <FormHelperText>Project Title.</FormHelperText>
            </FormControl>

            <FormControl>
                <FormLabel>Description</FormLabel>
                <Input type='text' name='description' onChange={(e) => setDescription(e.target.value)} />
                <FormHelperText>Project description.</FormHelperText>
            </FormControl>

            <FormControl>
                <FormLabel>Version</FormLabel>
                <Input type='text' name='version' onChange={(e) => setVersion(e.target.value)} />
                <FormHelperText>Project version.</FormHelperText>
            </FormControl>

            <FormControl>
                <FormLabel>Website URL</FormLabel>
                <Input type='text' name='website_url' onChange={(e) => setWebsite_url(e.target.value)} />
                <FormHelperText>Project version.</FormHelperText>
            </FormControl>

            <Button type='submit'>Submit</Button>
        </form>
    )
}