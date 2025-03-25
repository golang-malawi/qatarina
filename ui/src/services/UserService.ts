import axios from "axios";
import { getApiEndpoint } from "@/common/request";
import useAuthHeaders from "@/hooks/useAuthHeaders";

export default class UserService {
    apiEndpoint: string;

    constructor() {
        this.apiEndpoint = getApiEndpoint();
    }

    async create(data: any) {
        const res = await axios.post(`${this.apiEndpoint}/v1/users`, data, useAuthHeaders());
        if (res.status === 200) {
            return res;
        }
        throw new Error(res.data);
    }
}