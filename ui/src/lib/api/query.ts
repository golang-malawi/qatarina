import createFetchClient, { Middleware } from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers  = createAuthHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      request.headers.set(key, value as string);
    });
    return request;
  },
};

export const apiClient = createFetchClient<paths>({
  baseUrl: getApiEndpoint(),
});

apiClient.use(middleware);

const $api = createClient(apiClient)

export default $api