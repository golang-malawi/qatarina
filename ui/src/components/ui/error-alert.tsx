import { Alert } from "@chakra-ui/react"

export default function ErrorAlert({ message }: { message: string }) {
    return (
        <Alert.Root m="2" variant="outline" colorPalette="danger">
            <Alert.Content>{message}</Alert.Content>
        </Alert.Root>
    )
}
