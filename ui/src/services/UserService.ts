import axios from "axios";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class UserService {
    apiEndpoint: string;

    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint;
    }

    async create(data: any) {
        var res = await axios.post(`${this.apiEndpoint}/v1/users`, data, useAuthHeaders());
        if (res.status === 200) {
            return res;
        }
        throw new Error(res.data);
    }
}