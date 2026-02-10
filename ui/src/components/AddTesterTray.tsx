"use client";
import { Box, Link } from "@chakra-ui/react";
import { motion } from "framer-motion";

export default function AddTesterTray() {
    return (
        <>
        {/* overlay */}
        <div></div> 
        <motion.div
            initial={{y: 336}}
            animate={{y: 0}}
            exit={{y: 500}}
            transition={{ duration: 0.2, ease: 'easeIn'}}
            style={{ zIndex: 999 }}
        >
            <Box
                bg={'bg.surface'}
                position={'absolute'}
                bottom={0}
                border={'sm'}
                borderColor={'border.subtle'}
                boxShadow={'card'}
                overflow={'hidden'}
                height={'40'}
                width={'sm'}
                px={'6'}
                py={'4'}
                rounded={'lg'}
                display={'grid'}
                gap={'3'}
            >
                <Link href="/projects" color="fg.accent">Edit Associations</Link>
                <Link href="/projects" color="fg.accent">Add Tester</Link>
                <Link href="/projects" color="fg.accent">Remove Tester</Link>
            </Box>
        </motion.div>
        </>
    )
}
