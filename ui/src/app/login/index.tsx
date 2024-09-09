"use client";
import { Box, Button, Input, InputGroup, Link } from '@chakra-ui/react';
import axios from "axios";
import { useState } from 'react';
import { useNavigate } from "react-router";

interface LoginData {
    user_id: number
    token: string
    displayName: string
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const redirect = useNavigate();

    async function handleSubmit(e: Event) {
        e.preventDefault()
        const res = await axios.post('http://localhost:4597/v1/auth/login', {
            email,
            password
        });

        if (res.status == 200) {
            const loginData: LoginData = res.data;
            localStorage.setItem('auth.user_id', `${loginData.user_id}`);
            localStorage.setItem('auth.displayName', loginData.displayName);
            localStorage.setItem('auth.token', loginData.token);

            axios.defaults.withCredentials = false;
            axios.defaults.headers.common["Authorization"] = `Bearer ${loginData.token}`;
            redirect('/dashboard');
        }
        return false;
    }
    return (
        <div>
            <p className="text-3xl">QATARINA</p>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <Box>
                    <InputGroup>
                        <Input placeholder="E-mail" type="email" onChange={(e) => setEmail(e.target.value)} />
                        <Input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                    </InputGroup>
                    <Button type="submit">Login</Button>
                </Box>
            </form>
            <Link href="/forgot-password">Forgot Password?</Link>
        </div>
    )
};