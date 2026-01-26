import {useMutation} from "@tanstack/react-query";
import { changePassword } from "@/services/AuthService";
import { components } from "@/lib/api/v1";

type ChangePasswordRequest = components["schemas"]["schema.ChangePasswordRequest"]

export function useChangePasswordMutation() {
    return useMutation({
        mutationFn: async (req: ChangePasswordRequest) => {
            const res = await changePassword(req);
            return res?.data ?? res;
        }
    })
}