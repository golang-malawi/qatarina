import axios from "axios";
import { getApiEndpoint } from "../common/request";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class TestCaseService {
    apiEndpoint: string;
    constructor() {
        this.apiEndpoint = getApiEndpoint();
    }

    async findAll() {
        var res = await axios.get(`${this.apiEndpoint}/v1/test-cases`, useAuthHeaders())
        if (res.status == 200) {
            return res.data.test_cases || [];
        }
        throw new Error(res.data);
    }


    async findById(id: String) {
        var res = await axios.get(`${this.apiEndpoint}/v1/test-cases/${id}`, useAuthHeaders())
        if (res.status === 200) {
            return res.data.test_case;
        }
        throw new Error(res.data);
    }


    async findByProjectId(projectID: number) {
        var res = await axios.get(`${this.apiEndpoint}/v1/projects/${projectID}/test-cases`, useAuthHeaders())
        if (res.status === 200) {
            return res.data.test_cases || [];
        }
        throw new Error(res.data);
    }

    async create(data: any) {
        var res = await axios.post(`${this.apiEndpoint}/v1/test-cases`, data, useAuthHeaders())
        if (res.status === 200) {
            // TODO: return a specific shape of the response, not the whole response
            // return res.data.test_case;
            return res;
        }
        throw new Error(res.data);
    }


}