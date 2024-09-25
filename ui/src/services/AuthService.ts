import axios from "axios";

export class AuthService {
    apiEndpoint: string;


    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint
    }

    async login(email: string, password: string) {
        const res = await axios.post(`${this.apiEndpoint}/v1/auth/login`, {
            email,
            password
        });

        if (res.status === 200) {
            return res;
        }
        throw new Error(res.data)
    }
}