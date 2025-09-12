import { Alert } from "@chakra-ui/react"

export default function ErrorAlert({ message }: { message: string }) {
    return (
        <Alert.Root m="2" variant="outline" bgColor={"red.500"}>
            <Alert.Content>{message}</Alert.Content>
        </Alert.Root>
    )
}