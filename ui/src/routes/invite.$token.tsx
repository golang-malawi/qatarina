import PublicTestPage from "../pages/PublicTestPage";
import { createFileRoute} from "@tanstack/react-router"

export const Route = createFileRoute("/invite/$token")({
    component: PublicTestPage,
});