/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum DbsqlcTestRunState {
  TestRunStatePending = "pending",
  TestRunStatePassed = "passed",
  TestRunStateFailed = "failed",
  TestRunStateBlocked = "blocked",
}

export enum DbsqlcTestKind {
  TestKindGeneral = "general",
  TestKindAdhoc = "adhoc",
  TestKindTriage = "triage",
  TestKindIntegration = "integration",
  TestKindUserAcceptance = "user_acceptance",
  TestKindRegression = "regression",
  TestKindSecurity = "security",
  TestKindUserInterface = "user_interface",
  TestKindScenario = "scenario",
}

export interface ProblemdetailProblemDetail {
  context?: any;
  detail?: string;
  title?: string;
  type?: string;
}

export interface SchemaAssignTestsToPlanRequest {
  /**
   * @maxItems 100
   * @minItems 1
   */
  planned_tests: SchemaTestCaseAssignment[];
  project_id: number;
  test_plan_id: number;
}

export interface SchemaAssignedTestCase {
  actual_result?: string;
  assigned_to_id?: number;
  assignee_can_change_code?: boolean;
  code?: string;
  created_at?: string;
  created_by_id?: number;
  description?: string;
  expected_result?: string;
  external_issue_id?: string;
  feature_or_module?: string;
  id?: string;
  is_closed?: boolean;
  is_draft?: boolean;
  kind?: DbsqlcTestKind;
  notes?: string;
  owner_id?: number;
  parent_test_case_id?: number;
  project_id?: number;
  reactions?: number[];
  result_state?: DbsqlcTestRunState;
  tags?: string[];
  test_case_created_at?: string;
  test_case_updated_at?: string;
  test_plan_id?: number;
  test_run_id?: string;
  tested_by_id?: number;
  tested_on?: string;
  title?: string;
  updated_at?: string;
}

export interface SchemaAssignedTestCaseListResponse {
  test_cases?: SchemaAssignedTestCase[];
}

export interface SchemaBulkAssignTesters {
  project_id?: number;
  testers?: {
    role?: string;
    user_id?: number;
  }[];
}

export interface SchemaBulkCreateTestCases {
  project_id: number;
  /**
   * @maxItems 100
   * @minItems 1
   */
  test_cases: SchemaCreateTestCaseRequest[];
}

export interface SchemaCommitTestRunResult {
  actual_result: string;
  expected_result?: string;
  is_closed?: boolean;
  notes: string;
  /** State is the result of the test run */
  result_state: DbsqlcTestRunState;
  test_run_id: string;
  tested_on: string;
}

export interface SchemaCompactUserListResponse {
  total?: number;
  users?: SchemaUserCompact[];
}

export interface SchemaCreateProjectModuleRequest {
  code: string;
  description: string;
  name: string;
  priority: number;
  projectID: number;
  type: string;
}

export interface SchemaCreateTestCaseRequest {
  /** optional; auto-generated if blank */
  code?: string;
  description: string;
  feature_or_module: string;
  is_draft?: boolean;
  kind: string;
  project_id?: number;
  tags: string[];
  title: string;
}

export interface SchemaCreateTestPlan {
  assigned_to_id?: number;
  closed_at?: string;
  created_by_id?: number;
  description: string;
  kind: string;
  planned_tests?: SchemaTestCaseAssignment[];
  project_id: number;
  scheduled_end_at?: string;
  start_at: string;
  updated_by_id?: number;
}

export interface SchemaDashboardProjectRecord {
  id?: number;
  name?: string;
  updated_at?: string;
}

export interface SchemaDashboardSummaryResponse {
  closed_to_open_ratio?: number;
  project_count?: number;
  recent_projects?: SchemaDashboardProjectRecord[];
  test_case_count?: number;
  test_plan_count?: number;
  tester_count?: number;
}

export interface SchemaHealthStatus {
  message?: string;
  status?: string;
  uptime?: number;
}

export interface SchemaImportFromGithubRequest {
  github_token?: string;
  owner?: string;
  project_id?: number;
  repository?: string;
}

export type SchemaImportProjectRequest = object;

export interface SchemaLoginRequest {
  email: string;
  password: string;
}

export interface SchemaLoginResponse {
  displayName?: string;
  email?: string;
  expires_at?: number;
  token?: string;
  user_id?: number;
}

export interface SchemaMetrics {
  errorsTotal?: number;
  requestsTotal?: number;
  uptimeSeconds?: number;
}

export interface SchemaNewProjectRequest {
  /**
   * @minLength 3
   * @maxLength 10
   */
  code: string;
  description: string;
  github_url?: string;
  name: string;
  parent_project_id?: number;
  project_owner_id?: number;
  version: string;
  website_url: string;
}

export interface SchemaNewUserRequest {
  display_name: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id?: number;
  password: string;
}

export type SchemaPageRequest = object;

export interface SchemaProjectListResponse {
  projects?: SchemaProjectResponse[];
}

export interface SchemaProjectResponse {
  code?: string;
  created_at?: string;
  description?: string;
  github_url?: string;
  id?: number;
  is_active?: boolean;
  is_public?: boolean;
  jira_url?: string;
  monday_url?: string;
  owner_user_id?: number;
  title?: string;
  trello_url?: string;
  updated_at?: string;
  version?: string;
  website_url?: string;
}

export type SchemaRefreshTokenRequest = object;

export type SchemaRefreshTokenResponse = object;

export interface SchemaSignUpRequest {
  display_name: string;
  email: string;
  firstname: string;
  lastname: string;
  password: string;
}

export interface SchemaSystemInfo {
  buildDate?: string;
  developedBy?: string;
  projectUrl?: string;
  sha?: string;
  title?: string;
  version?: string;
}

export interface SchemaTestCaseAssignment {
  test_case_id?: string;
  user_ids?: number[];
}

export interface SchemaTestCaseListResponse {
  test_cases?: SchemaTestCaseResponse[];
}

export interface SchemaTestCaseResponse {
  code?: string;
  created_at?: string;
  created_by?: number;
  description?: string;
  feature_or_module?: string;
  id?: string;
  is_draft?: boolean;
  kind?: string;
  project_id?: number;
  tags?: string[];
  title?: string;
  updated_at?: string;
}

export interface SchemaTestPlanListResponse {
  test_plans?: SchemaTestPlanResponseItem[];
}

export interface SchemaTestPlanResponseItem {
  assigned_to_id?: number;
  closed_at?: string;
  created_at?: string;
  created_by_id?: number;
  description?: string;
  has_report?: boolean;
  id?: number;
  is_complete?: boolean;
  is_locked?: boolean;
  kind?: string;
  num_failures?: number;
  num_test_cases?: number;
  project_id?: number;
  scheduled_end_at?: string;
  start_at?: string;
  updated_at?: string;
  updated_by_id?: number;
}

export interface SchemaTestRunListResponse {
  test_runs?: SchemaTestRunResponse[];
}

export interface SchemaTestRunResponse {
  id?: string;
  project_id?: number;
  test_plan_id?: number;
}

export interface SchemaTester {
  created_at?: string;
  last_login_at?: string;
  name?: string;
  project?: string;
  project_id?: number;
  role?: string;
  updated_at?: string;
  user_id?: number;
}

export interface SchemaTesterListResponse {
  testers?: SchemaTester[];
}

export type SchemaUpdatePageRequest = object;

export interface SchemaUpdateProjectModuleRequest {
  code: string;
  description?: string;
  id: number;
  name: string;
  priority: number;
  type: string;
}

export interface SchemaUpdateProjectRequest {
  /**
   * @minLength 3
   * @maxLength 10
   */
  code: string;
  description: string;
  github_url?: string;
  id: number;
  name: string;
  parent_project_id?: number;
  project_owner_id: number;
  version: string;
  website_url: string;
}

export interface SchemaUpdateTestCaseRequest {
  code: string;
  description: string;
  feature_or_module: string;
  id: string;
  is_draft: boolean;
  kind: string;
  tags: string[];
  title: string;
}

export interface SchemaUpdateUserRequest {
  address?: string;
  city: string;
  country_iso?: string;
  display_name: string;
  first_name: string;
  id?: number;
  last_name: string;
  org_id: number;
  phone?: string;
}

export interface SchemaUserCompact {
  createdAt?: string;
  displayName?: string;
  id?: number;
  username?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title No title
 * @contact
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  healthz = {
    /**
     * @description Returns the health status of the system
     *
     * @tags system
     * @name HealthzList
     * @summary Health check endpoint
     * @request GET:/healthz
     */
    healthzList: (params: RequestParams = {}) =>
      this.request<SchemaHealthStatus, any>({
        path: `/healthz`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  metrics = {
    /**
     * @description Returns system metrics for monitoring
     *
     * @tags system
     * @name MetricsList
     * @summary System metrics endpoint
     * @request GET:/metrics
     */
    metricsList: (params: RequestParams = {}) =>
      this.request<SchemaMetrics, any>({
        path: `/metrics`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  system = {
    /**
     * @description Returns general information about the system including version and build details
     *
     * @tags system
     * @name InfoList
     * @summary System information
     * @request GET:/system/info
     */
    infoList: (params: RequestParams = {}) =>
      this.request<SchemaSystemInfo, any>({
        path: `/system/info`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  v1 = {
    /**
     * @description Authenticates a user and returns access tokens
     *
     * @tags auth
     * @name AuthLoginCreate
     * @summary User login
     * @request POST:/v1/auth/login
     */
    authLoginCreate: (
      request: SchemaLoginRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaLoginResponse, ProblemdetailProblemDetail>({
        path: `/v1/auth/login`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Refreshes an expired access token using a valid refresh token
     *
     * @tags auth
     * @name AuthRefreshTokenCreate
     * @summary Refresh access token
     * @request POST:/v1/auth/refresh-token
     */
    authRefreshTokenCreate: (
      request: SchemaRefreshTokenRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaRefreshTokenResponse, ProblemdetailProblemDetail>({
        path: `/v1/auth/refresh-token`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Registers a new user account
     *
     * @tags auth
     * @name AuthSignupCreate
     * @summary User signup
     * @request POST:/v1/auth/signup
     */
    authSignupCreate: (
      request: SchemaSignUpRequest,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, ProblemdetailProblemDetail>({
        path: `/v1/auth/signup`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns key metrics for dashboard
     *
     * @tags dashboard
     * @name DashboardSummary
     * @summary Get dashboard summary
     * @request GET:/v1/dashboard/summary
     */
    dashboardSummary: (params: RequestParams = {}) =>
      this.request<SchemaDashboardSummaryResponse, ProblemdetailProblemDetail>({
        path: `/v1/dashboard/summary`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List Test Cases assigned to the current user
     *
     * @tags test-cases
     * @name ListAssignedTestCases
     * @summary List Test Cases assigned to the current user
     * @request GET:/v1/me/test-cases/inbox
     */
    listAssignedTestCases: (params: RequestParams = {}) =>
      this.request<
        SchemaAssignedTestCaseListResponse,
        ProblemdetailProblemDetail
      >({
        path: `/v1/me/test-cases/inbox`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all Modules
     *
     * @tags modules
     * @name GetAllModules
     * @summary Get all Modules
     * @request GET:/v1/modules
     */
    getAllModules: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/modules`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a Module
     *
     * @tags modules
     * @name CreateModule
     * @summary Create a Module
     * @request POST:/v1/modules
     */
    createModule: (
      request: SchemaCreateProjectModuleRequest,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/modules`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Module
     *
     * @tags modules
     * @name GetOneModule
     * @summary Get one Module
     * @request GET:/v1/modules/{moduleID}
     */
    getOneModule: (moduleId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/modules/${moduleId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a Module
     *
     * @tags modules
     * @name UpdateModule
     * @summary Update a Module
     * @request POST:/v1/modules/{moduleID}
     */
    updateModule: (
      moduleId: string,
      request: SchemaUpdateProjectModuleRequest,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/modules/${moduleId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a Module
     *
     * @tags modules
     * @name DeleteModule
     * @summary Delete a Module
     * @request DELETE:/v1/modules/{moduleID}
     */
    deleteModule: (moduleId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/modules/${moduleId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all pages
     *
     * @tags pages
     * @name GetAllPages
     * @summary Get all pages
     * @request GET:/v1/pages
     */
    getAllPages: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/pages`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a page
     *
     * @tags pages
     * @name CreatePage
     * @summary Create a page
     * @request POST:/v1/pages
     */
    createPage: (request: SchemaPageRequest, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/pages`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one page
     *
     * @tags pages
     * @name GetOnePage
     * @summary Get one page
     * @request GET:/v1/pages/{pageID}
     */
    getOnePage: (pageId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/pages/${pageId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a page
     *
     * @tags pages
     * @name UpdatePage
     * @summary Update a page
     * @request POST:/v1/pages/{pageID}
     */
    updatePage: (
      pageId: string,
      request: SchemaUpdatePageRequest,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/pages/${pageId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a page
     *
     * @tags pages
     * @name DeletePage
     * @summary Delete a page
     * @request DELETE:/v1/pages/{pageID}
     */
    deletePage: (pageId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/pages/${pageId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List Projects available on the platform
     *
     * @tags projects
     * @name ListProject
     * @summary List Projects available on the platform
     * @request GET:/v1/projects
     */
    listProject: (params: RequestParams = {}) =>
      this.request<SchemaProjectListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a Project
     *
     * @tags projects
     * @name CreateProject
     * @summary Create a Project
     * @request POST:/v1/projects
     */
    createProject: (
      request: SchemaNewProjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaProjectResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Import Projects from some source
     *
     * @tags projects
     * @name ImportProject
     * @summary Import Projects from some source
     * @request POST:/v1/projects/import
     */
    importProject: (
      request: SchemaImportProjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaProjectListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/import`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search for a Project
     *
     * @tags projects
     * @name SearchProjects
     * @summary Search for a Project
     * @request GET:/v1/projects/query
     */
    searchProjects: (params: RequestParams = {}) =>
      this.request<SchemaProjectListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/query`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a single Project
     *
     * @tags projects
     * @name GetOneProject
     * @summary Get a single Project
     * @request GET:/v1/projects/{projectID}
     */
    getOneProject: (projectId: string, params: RequestParams = {}) =>
      this.request<SchemaProjectResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a Project
     *
     * @tags projects
     * @name UpdateProject
     * @summary Update a Project
     * @request POST:/v1/projects/{projectID}
     */
    updateProject: (
      projectId: string,
      request: SchemaUpdateProjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaProjectResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a Project
     *
     * @tags projects
     * @name DeleteProject
     * @summary Delete a Project
     * @request DELETE:/v1/projects/{projectID}
     */
    deleteProject: (projectId: string, params: RequestParams = {}) =>
      this.request<Record<string, string>, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a Modules by project
     *
     * @tags modules
     * @name GetProjectModule
     * @summary Get a Modules by project
     * @request GET:/v1/projects/{projectID}/modules
     */
    getProjectModule: (projectId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}/modules`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a single Project's test cases
     *
     * @tags projects
     * @name GetProjectTestCases
     * @summary Get a single Project's test cases
     * @request GET:/v1/projects/{projectID}/test-cases
     */
    getProjectTestCases: (projectId: string, params: RequestParams = {}) =>
      this.request<SchemaTestCaseListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}/test-cases`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a single Project's test plans
     *
     * @tags projects
     * @name GetProjectTestPlans
     * @summary Get a single Project's test plans
     * @request GET:/v1/projects/{projectID}/test-plans
     */
    getProjectTestPlans: (projectId: string, params: RequestParams = {}) =>
      this.request<SchemaTestPlanListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}/test-plans`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a single Project's test runs
     *
     * @tags projects
     * @name GetProjectTestRuns
     * @summary Get a single Project's test runs
     * @request GET:/v1/projects/{projectID}/test-runs
     */
    getProjectTestRuns: (projectId: string, params: RequestParams = {}) =>
      this.request<SchemaTestRunListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}/test-runs`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all Testers for a specific Project
     *
     * @tags projects
     * @name GetProjectTesters
     * @summary Get all Testers for a specific Project
     * @request GET:/v1/projects/{projectID}/testers
     */
    getProjectTesters: (projectId: number, params: RequestParams = {}) =>
      this.request<SchemaTesterListResponse, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}/testers`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Assign multiple testers to a project
     *
     * @tags projects
     * @name AssignTesters
     * @summary Assign testers to a project
     * @request POST:/v1/projects/{projectID}/testers/assign
     */
    assignTesters: (
      projectId: number,
      request: SchemaBulkAssignTesters,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>, ProblemdetailProblemDetail>({
        path: `/v1/projects/${projectId}/testers/assign`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieves all system settings
     *
     * @tags settings
     * @name SettingsList
     * @summary Get system settings
     * @request GET:/v1/settings
     * @secure
     */
    settingsList: (params: RequestParams = {}) =>
      this.request<Record<string, any>, ProblemdetailProblemDetail>({
        path: `/v1/settings`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Updates a specific system setting
     *
     * @tags settings
     * @name SettingsUpdate
     * @summary Update system setting
     * @request PUT:/v1/settings
     * @secure
     */
    settingsUpdate: (
      request: Record<string, any>,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, ProblemdetailProblemDetail>({
        path: `/v1/settings`,
        method: "PUT",
        body: request,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List Test Cases
     *
     * @tags test-cases
     * @name ListTestCases
     * @summary List Test Cases
     * @request GET:/v1/test-cases
     */
    listTestCases: (params: RequestParams = {}) =>
      this.request<SchemaTestCaseListResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new Test Case
     *
     * @tags test-cases
     * @name CreateTestCase
     * @summary Create a new Test Case
     * @request POST:/v1/test-cases
     */
    createTestCase: (
      request: SchemaCreateTestCaseRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaTestCaseResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create multiple Test Cases at once
     *
     * @tags test-cases
     * @name BulkCreateTestCases
     * @summary Create multiple Test Cases at once
     * @request POST:/v1/test-cases/bulk
     */
    bulkCreateTestCases: (
      request: SchemaBulkCreateTestCases,
      params: RequestParams = {},
    ) =>
      this.request<SchemaTestCaseListResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/bulk`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Import test cases from Excel or CSV file
     *
     * @tags test-cases
     * @name ImportTestCasesFromFile
     * @summary Import test cases from Excel or CSV file
     * @request POST:/v1/test-cases/import-file
     */
    importTestCasesFromFile: (
      formData: string,
      request: any,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/import-file`,
        method: "POST",
        body: request,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description Imports open issues from a GitHub repository as test cases for a project
     *
     * @tags test-cases
     * @name ImportIssuesFromGitHubAsTestCases
     * @summary Import GitHub issues as test cases
     * @request POST:/v1/test-cases/import/github
     */
    importIssuesFromGitHubAsTestCases: (
      request: SchemaImportFromGithubRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaTestCaseListResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/import/github`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search for Test Cases
     *
     * @tags test-cases
     * @name SearchTestCases
     * @summary Search for Test Cases
     * @request GET:/v1/test-cases/query
     */
    searchTestCases: (params: RequestParams = {}) =>
      this.request<SchemaTestCaseListResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/query`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a single Test Case
     *
     * @tags test-cases
     * @name GetOneTestCase
     * @summary Get a single Test Case
     * @request GET:/v1/test-cases/{testCaseID}
     */
    getOneTestCase: (testCaseId: string, params: RequestParams = {}) =>
      this.request<SchemaTestCaseResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/${testCaseId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a Test Case
     *
     * @tags test-cases
     * @name UpdateTestCase
     * @summary Update a Test Case
     * @request POST:/v1/test-cases/{testCaseID}
     */
    updateTestCase: (
      testCaseId: string,
      request: SchemaUpdateTestCaseRequest,
      params: RequestParams = {},
    ) =>
      this.request<SchemaTestCaseResponse, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/${testCaseId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a test case
     *
     * @tags test-cases
     * @name DeleteTestCase
     * @summary Delete a test case
     * @request DELETE:/v1/test-cases/{testCaseID}
     */
    deleteTestCase: (testCaseId: string, params: RequestParams = {}) =>
      this.request<Record<string, string>, ProblemdetailProblemDetail>({
        path: `/v1/test-cases/${testCaseId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all Test Plans
     *
     * @tags test-plans
     * @name ListTestPlans
     * @summary List all Test Plans
     * @request GET:/v1/test-plans
     */
    listTestPlans: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new Test Plan
     *
     * @tags test-plans
     * @name CreateTestPlan
     * @summary Create a new Test Plan
     * @request POST:/v1/test-plans
     */
    createTestPlan: (
      request: SchemaCreateTestPlan,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search test plans
     *
     * @tags test-plans
     * @name SearchTestPlans
     * @summary Search test plans
     * @request GET:/v1/test-plans/query
     */
    searchTestPlans: (query: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/query`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Test Plan
     *
     * @tags test-plans
     * @name GetOneTestPlan
     * @summary Get one Test Plan
     * @request GET:/v1/test-plans/{testPlanID}
     */
    getOneTestPlan: (testPlanId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a Test Plan
     *
     * @tags test-plans
     * @name UpdateTestPlan
     * @summary Update a Test Plan
     * @request POST:/v1/test-plans/{testPlanID}
     */
    updateTestPlan: (
      testPlanId: string,
      request: any,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a Test Plan
     *
     * @tags test-plans
     * @name DeleteTestPlan
     * @summary Delete a Test Plan
     * @request DELETE:/v1/test-plans/{testPlanID}
     */
    deleteTestPlan: (testPlanId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Close a Test Plan
     *
     * @tags test-plans
     * @name CloseTestPlan
     * @summary Close a Test Plan
     * @request POST:/v1/test-plans/{testPlanID}/close
     */
    closeTestPlan: (testPlanId: number, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}/close`,
        method: "POST",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all tests of a test plan
     *
     * @tags test-cases, test-runs
     * @name GetTestPlanTestCases
     * @summary List all tests of a test plan
     * @request GET:/v1/test-plans/{testPlanID}/test-cases
     */
    getTestPlanTestCases: (
      testplanId: string,
      testPlanId: string,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}/test-cases`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Assign a test to a plan
     *
     * @tags test-plans
     * @name AssignTestsToPlan
     * @summary Assign a test to a plan
     * @request POST:/v1/test-plans/{testPlanID}/test-cases
     */
    assignTestsToPlan: (
      testPlanId: string,
      request: SchemaAssignTestsToPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}/test-cases`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all test cases of a test plan
     *
     * @tags test-plans
     * @name GetTestPlanTestRuns
     * @summary List all test cases of a test plan
     * @request GET:/v1/test-plans/{testPlanID}/test-runs
     */
    getTestPlanTestRuns: (
      testplanId: string,
      testPlanId: string,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-plans/${testPlanId}/test-runs`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List Test Runs
     *
     * @tags test-runs
     * @name ListTestRuns
     * @summary List Test Runs
     * @request GET:/v1/test-runs
     */
    listTestRuns: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new Test Run
     *
     * @tags test-runs
     * @name CreateTestRun
     * @summary Create a new Test Run
     * @request POST:/v1/test-runs
     */
    createTestRun: (request: any, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search for Test Runs
     *
     * @tags test-runs
     * @name SearchTestRuns
     * @summary Search for Test Runs
     * @request GET:/v1/test-runs/query
     */
    searchTestRuns: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs/query`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Test Run
     *
     * @tags test-runs
     * @name GetOneTestRun
     * @summary Get one Test Run
     * @request GET:/v1/test-runs/{testRunID}
     */
    getOneTestRun: (testRunId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs/${testRunId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a Test Run
     *
     * @tags test-runs
     * @name UpdateTestRun
     * @summary Update a Test Run
     * @request POST:/v1/test-runs/{testRunID}
     */
    updateTestRun: (
      testRunId: string,
      request: any,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs/${testRunId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a Test Run
     *
     * @tags test-runs
     * @name DeleteTestRun
     * @summary Delete a Test Run
     * @request DELETE:/v1/test-runs/{testRunID}
     */
    deleteTestRun: (testRunId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs/${testRunId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark a Test Run as committed
     *
     * @tags test-runs
     * @name CommitTestRun
     * @summary Mark a Test Run as committed
     * @request POST:/v1/test-runs/{testRunID}/commit
     */
    commitTestRun: (
      testRunId: string,
      request: SchemaCommitTestRunResult,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/test-runs/${testRunId}/commit`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all Testers
     *
     * @tags testers
     * @name ListTesters
     * @summary List all Testers
     * @request GET:/v1/testers
     */
    listTesters: (params: RequestParams = {}) =>
      this.request<SchemaTesterListResponse, ProblemdetailProblemDetail>({
        path: `/v1/testers`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search all Testers
     *
     * @tags testers
     * @name SearchTesters
     * @summary Search all Testers
     * @request GET:/v1/testers.query
     */
    searchTesters: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/testers.query`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Invite a tester by Email
     *
     * @tags testers
     * @name InviteTester
     * @summary Invite a tester by Email
     * @request POST:/v1/testers/invite/{email}
     */
    inviteTester: (email: string, request: any, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/testers/invite/${email}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a Tester by ID
     *
     * @tags testers
     * @name GetOneTester
     * @summary Get a Tester by ID
     * @request GET:/v1/testers/{testerID}
     */
    getOneTester: (testerId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/testers/${testerId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all Users
     *
     * @tags users
     * @name ListUsers
     * @summary List all Users
     * @request GET:/v1/users
     */
    listUsers: (params: RequestParams = {}) =>
      this.request<SchemaCompactUserListResponse, ProblemdetailProblemDetail>({
        path: `/v1/users`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new User
     *
     * @tags users
     * @name CreateUser
     * @summary Create a new User
     * @request POST:/v1/users
     */
    createUser: (request: SchemaNewUserRequest, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/users`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Invite a User by email
     *
     * @tags users
     * @name InviteUser
     * @summary Invite a User by email
     * @request POST:/v1/users/invite/{email}
     */
    inviteUser: (email: string, request: any, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/users/invite/${email}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Search all Users
     *
     * @tags users
     * @name SearchUsers
     * @summary Search all Users
     * @request GET:/v1/users/query
     */
    searchUsers: (params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/users/query`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one User
     *
     * @tags users
     * @name GetOneUser
     * @summary Get one User
     * @request GET:/v1/users/{userID}
     */
    getOneUser: (userId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/users/${userId}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a User
     *
     * @tags users
     * @name UpdateUser
     * @summary Update a User
     * @request POST:/v1/users/{userID}
     */
    updateUser: (
      userId: string,
      request: SchemaUpdateUserRequest,
      params: RequestParams = {},
    ) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/users/${userId}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a user
     *
     * @tags users
     * @name DeleteUser
     * @summary Delete a user
     * @request DELETE:/v1/users/{userID}
     */
    deleteUser: (userId: string, params: RequestParams = {}) =>
      this.request<any, ProblemdetailProblemDetail>({
        path: `/v1/users/${userId}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
