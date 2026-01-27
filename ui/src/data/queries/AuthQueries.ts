import {useMutation} from "@tanstack/react-query";
import { changePassword } from "@/services/AuthService";

export function useChangePasswordMutation() {
    return useMutation({
        mutationFn: changePassword,       
    });
}