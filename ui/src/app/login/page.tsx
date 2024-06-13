"use client";
import React from "react";
import { Link, Input, Button, Box, InputGroup } from '@chakra-ui/react';

export default function LoginPage() {
    return (
        <div>
            <p className="text-3xl">QATARINA</p>
            <h2>Login</h2>
            <Box>
                <InputGroup>
                    <Input placeholder="E-mail"  type="email"/>
                    <Input type="password" placeholder="Password " />
                </InputGroup>
            <Button>Login</Button>
            </Box>
            <Link href="/forgot-password">Forgot Password?</Link>
        </div>
    )
};