import {
    Box,
    Button,
    Checkbox,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import useAuthHeaders from '../hooks/useAuthHeaders';

interface TesterRecord {
    user_id: number;
    name: string;
    last_login_at: string;
}

export default function SelectTesterModal({ testCaseID }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedTesters, setSelectedTesters] = useState<number>([]);
    const [testers, setTesters] = useState<TesterRecord[]>([]);

    async function fetchTesters() {
        const res = await axios.get("http://localhost:4597/v1/testers", useAuthHeaders())
        if (res.status == 200) {
            setTesters(res.data.testers)
        }
    }
    useEffect(() => {
        fetchTesters()
    }, []);

    function addTesterUser(testerID: number) {
        setSelectedTesters([...selectedTesters, testerID]);
    }


    const testerList = testers.map((tester, idx) =>
        <Box key={idx}>
            <Checkbox value={tester.user_id} onChange={(e) => {
                if (e.target.checked) {
                    addTesterUser(parseInt(e.target.value))
                }
            }} /> {tester.name}
        </Box>
    )

    return (
        <>
            <Button onClick={onOpen}>Assign Testers</Button>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Select Testers to Assign</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {testerList}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='blue' mr={3} onClick={onClose}>
                            Close
                        </Button>
                        <Button variant='ghost'>Assign Testers</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}