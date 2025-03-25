import axios from "axios";
import { getApiEndpoint } from "@/common/request";
import useAuthHeaders from "@/hooks/useAuthHeaders";

export default class TesterService {
    apiEndpoint: string;

    constructor() {
        this.apiEndpoint = getApiEndpoint();
    }

    async findAll() {
        const res = await axios.get(`${this.apiEndpoint}/v1/testers`, useAuthHeaders());
        if (res.status === 200) {
            return res.data.testers;
        }
        throw new Error(res.data);
    }

    async findById(id: string) {
        const res = await axios.get(`${this.apiEndpoint}/v1/testers/${id}`, useAuthHeaders());
        if (res.status === 200) {
            return res.data.tester;
        }
        throw new Error(res.data);
    }

    async deleteTester(id: string) {
        const res = await axios.delete(`${this.apiEndpoint}/v1/testers/${id}`, useAuthHeaders());
        if (res.status === 200) {
            return res.data.testers;
        }
        throw new Error(res.data);
    }
}