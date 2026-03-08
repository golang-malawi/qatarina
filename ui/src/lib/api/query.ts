import createFetchClient, { Middleware } from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";
import { setStoredUser } from "@/context/UserStorage";

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers  = createAuthHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      request.headers.set(key, value as string);
    });
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      setStoredUser(null);
      window.location.href = "/login";
    }
    return response;
  },
};

export const apiClient = createFetchClient<paths>({
  baseUrl: getApiEndpoint(),
});

apiClient.use(middleware);

const $api = createClient(apiClient)

export default $api