import createClient from "openapi-fetch";
import type { paths } from "./v1";
import { getApiEndpoint } from "@/common/request";

const client = createClient<paths>({ baseUrl: getApiEndpoint() });

export default client;

