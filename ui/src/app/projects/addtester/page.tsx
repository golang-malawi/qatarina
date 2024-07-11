"use client";
import AddTesterTray from "@/components/AddTesterTray";
import { Button } from "@chakra-ui/react";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function AddTesterPage() {
    const [trayOpen, setTrayOpen] = useState(false);
    return (
        <div>
            <Button onClick={() => setTrayOpen(true)}>Open Options</Button>
            {trayOpen && <AnimatePresence>
                <AddTesterTray />
            </AnimatePresence>}
        </div>
    )
}