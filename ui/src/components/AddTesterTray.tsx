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
            <Box background={'white'} position={'absolute'} bottom={0} border={'1px solid rgba(200,200,200,0.5)'} boxShadow={'0px 1px 2px rgba(100,100,100,0.3)'} overflow={'hidden'} height={'10rem'} width={"22rem"} px={'6'} py={'4'} rounded={'lg'}>
                <Link href="/projects">Edit Associations</Link>
                <Link href="/projects">Add Tester</Link>
                <Link href="/projects">Remove Tester</Link>
            </Box>
        </motion.div>
        </>
    )
}