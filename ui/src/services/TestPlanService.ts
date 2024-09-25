import axios from "axios";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class TestPlanService {
    apiEndpoint: string;

    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint;
    }

    async findAll() {
        var res = await axios.get(`${this.apiEndpoint}/v1/test-plans`, useAuthHeaders());
        if (res.status === 200) {
            return res.data.test_plans;
        }
        throw new Error(res.data);
    }

    async findById(id: string) {
        var res = await axios.get(`${this.apiEndpoint}/v1/test-plans/${id}`, useAuthHeaders());
        if (res.status === 200) {
            return res.data.test_plan;
        }
        throw new Error(res.data);
    }

    async create(data: any) {
        var res = await axios.post(`${this.apiEndpoint}/v1/test-plans`, data, useAuthHeaders());
        if (res.status === 200) {
            return res;
        }
        throw new Error(res.data);
    }

    async deleteTester(id: string) {
        var res = await axios.delete(`${this.apiEndpoint}/v1/test-plans/${id}`, useAuthHeaders());
        if (res.status === 200) {
            return res.data.test_plan;
        }
        throw new Error(res.data);
    }
}
