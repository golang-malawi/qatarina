import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import { components } from "@/lib/api/v1";
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type TestPlan = components["schemas"]["schema.TestPlanResponseItem"];

export type TestPlansResponse = {
  test_plans: TestPlan[];
};

export type Comment = components["schemas"]["schema.CommentResponseItem"];
export type CommentListResponse = components["schemas"]["schema.CommentListResponse"];
export type CommentAttachment = components["schemas"]["schema.CommentAttachment"];
export type CommentReaction = components["schemas"]["schema.CommentReaction"];
export type LinkPreview = components["schemas"]["schema.LinkPreview"];

type AssignTestsToPlanPayload = components["schemas"]["schema.AssignTestsToPlanRequest"];

/**
 * The test plans that can still take test cases and testers. Closing a test plan
 * locks it, so closed plans are left out wherever test cases are assigned to a plan.
 */
export function openTestPlans<T extends { is_complete?: boolean }>(plans?: T[] | null): T[] {
  return (plans ?? []).filter((plan) => !plan.is_complete);
}

export function useProjectTestPlansQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}/test-plans", {
    params: { path: { projectID } },
  });
}

export function useTestPlanQuery(testPlanID: string) {
  return $api.useQuery("get", "/v1/test-plans/{testPlanID}", {
    params: { path: { testPlanID } },
  });
}

export function useCreateTestPlanMutation() {
  return $api.useMutation("post", "/v1/test-plans");
}

export function useDeleteTestPlanMutation() {
  return $api.useMutation("delete", "/v1/test-plans/{testPlanID}");
}

export function useTestPlansQuery() {
  return $api.useQuery("get", "/v1/test-plans");
}

export async function getProjectTestPlans(
  projectID: string
): Promise<TestPlansResponse> {
  const res = await apiClient.request(
    "get", "/v1/projects/{projectID}/test-plans", 
    { params: { path: { projectID } }}
  );
  return res.data as TestPlansResponse;
}

export async function getTestPlanById(testPlanID: string) {
  return apiClient.request("get", "/v1/test-plans/{testPlanID}", {
    params: { path: { testPlanID } },
  });
}

export async function createTestPlan(data: any) {
  return apiClient.request("post", "/v1/test-plans", { body: data });
}

export async function deleteTestPlan(testPlanID: string) {
  return apiClient.request("delete", "/v1/test-plans/{testPlanID}", {
    params: { path: { testPlanID } },
  });
}

export async function getTestPlans() : Promise<TestPlansResponse> {
  const res = await apiClient.request("get", "/v1/test-plans");
  return res.data as TestPlansResponse;
}

export async function getTestRuns(testPlanID: string) {
  return apiClient.request("get", "/v1/test-plans/{testPlanID}/test-runs", {
    params: { path: { testPlanID: testPlanID } },
  });
}

export async function assignTestersToTestPlan(
  testPlanID: string,
  payload: AssignTestsToPlanPayload
) {
  const response = await apiClient.request(
    "post",
    "/v1/test-plans/{testPlanID}/test-cases",
    {
      params: { path: { testPlanID } },
      body: payload,
    }
  );

  // Check if the request failed, e.g. test cases from frozen modules are rejected
  if (!response.response.ok) {
    const error = response.error as any;
    throw new Error(error?.detail || "Failed to assign test cases to test plan");
  }

  return response.data;
}

export async function closeTestPlan(testPlanID: number) {
  const response = await apiClient.request(
    "post",
    "/v1/test-plans/{testPlanID}/close",
    {
      params: { path: { testPlanID } },
    }
  );

  // Check if the request failed
  if (!response.response.ok) {
    const error = response.error as any;
    throw new Error(error?.detail || "Failed to close test plan");
  }

  return response.data;
}

// Reopens a closed test plan, only allowed for its creator, the project owner or super admins
export async function reopenTestPlan(testPlanID: number) {
  const response = await apiClient.request(
    "post",
    "/v1/test-plans/{testPlanID}/reopen",
    {
      params: { path: { testPlanID } },
    }
  );

  if (!response.response.ok) {
    const error = response.error as any;
    throw new Error(error?.detail || "Failed to reopen test plan");
  }

  return response.data;
}

export function useUpdateTestPlanCaseUrgencyMutation() {
  return $api.useMutation(
    "post",
    "/v1/test-plans/{testPlanID}/test-cases/{testCaseID}/urgency"
  );
}

export function useCloseTestPlanMutation() {
  return $api.useMutation("post", "/v1/test-plans/{testPlanID}/close");
}

export async function changeTestPlanEnvironment(
  testPlanID: number,
  environmentID: number

){
  const response = await apiClient.request(
    "post", 
    "/v1/test-plans/{testPlanID}/environment",
    {
      params: {path: {testPlanID: String(testPlanID)}},
      body: {environment_id: environmentID},
    }
  );

  if (!response.response.ok) {
    const error = response.error as any;
    throw new Error(error?.detail || "Failed to update test plan");
    
  }

  return response.data;
}

export function useTestPlanTestCasesQuery(testPlanID: number) {
  return $api.useQuery("get", "/v1/test-plans/{testPlanID}/test-cases", {
    params: { path: { testPlanID } },
  });
}

export async function getTestPlanTestCases(testPlanID: number) {
  const res = await apiClient.request(
    "get",
    "/v1/test-plans/{testPlanID}/test-cases",
    { params: { path: { testPlanID } } }
  );
  return res.data as components["schemas"]["schema.TestCaseListResponse"];
}

// Loads top-level comments (newest first, with their replies) a page at a time for infinite scrolling
export function useTestPlanCommentsInfiniteQuery(testPlanID: number, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ["test-plan-comments", testPlanID, pageSize],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET("/v1/test-plans/{testPlanID}/comments", {
        params: { path: { testPlanID }, query: { page: pageParam, pageSize } },
      });
      if (error || !data) throw new Error(error?.detail || "Failed to load comments");
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.pagination?.total ?? 0;
      return allPages.length * pageSize < total ? allPages.length + 1 : undefined;
    },
  });
}

export function useCreateCommentMutation() {
  return $api.useMutation("post", "/v1/test-plans/{testPlanID}/comments");
}

export function useUpdateCommentMutation() {
  return $api.useMutation("put", "/v1/test-plans/{testPlanID}/comments/{commentID}");
}

export function useDeleteCommentMutation() {
  return $api.useMutation("delete", "/v1/test-plans/{testPlanID}/comments/{commentID}");
}

// Replaces the reactions of one comment (or reply, at any depth) in the cached comment pages
function withReactions(
  data: InfiniteData<CommentListResponse> | undefined,
  commentID: string,
  reactions: CommentReaction[]
) {
  if (!data) return data;
  const update = (comments?: Comment[]): Comment[] | undefined =>
    comments?.map((c) =>
      c.id === commentID ? { ...c, reactions } : c.replies?.length ? { ...c, replies: update(c.replies) } : c
    );
  return { ...data, pages: data.pages.map((page) => ({ ...page, comments: update(page.comments) })) };
}

/**
 * Sets or removes the signed-in user's reaction to a comment. People have one reaction per
 * comment, like WhatsApp: picking another emoji replaces it, picking the same one removes it.
 * The change shows straight away and is rolled back if the server rejects it.
 */
export function useCommentReaction(testPlanID: number) {
  const queryClient = useQueryClient();
  const queryKey = ["test-plan-comments", testPlanID];

  return async (
    comment: Comment,
    emoji: string,
    me: { user_id: number; user_name?: string }
  ): Promise<void> => {
    if (!comment.id) return;
    const commentID = comment.id;
    const current = comment.reactions ?? [];
    const mine = current.find((r) => r.user_id === me.user_id);
    const removing = mine?.emoji === emoji;
    const others = current.filter((r) => r.user_id !== me.user_id);
    const optimistic = removing ? others : [...others, { emoji, user_id: me.user_id, user_name: me.user_name }];

    await queryClient.cancelQueries({ queryKey });
    const snapshot = queryClient.getQueriesData<InfiniteData<CommentListResponse>>({ queryKey });
    queryClient.setQueriesData<InfiniteData<CommentListResponse>>({ queryKey }, (data) =>
      withReactions(data, commentID, optimistic)
    );

    const path = { params: { path: { testPlanID, commentID } } };
    const { data, error } = removing
      ? await apiClient.DELETE("/v1/test-plans/{testPlanID}/comments/{commentID}/reaction", path)
      : await apiClient.PUT("/v1/test-plans/{testPlanID}/comments/{commentID}/reaction", { ...path, body: { emoji } });

    if (error || !data) {
      snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      throw new Error(error?.detail || error?.title || "Failed to save reaction");
    }
    queryClient.setQueriesData<InfiniteData<CommentListResponse>>({ queryKey }, (cached) =>
      withReactions(cached, commentID, data)
    );
  };
}

export function useConvertCommentMutation() {
  return $api.useMutation("post", "/v1/test-plans/{testPlanID}/comments/{commentID}/convert");
}

export async function uploadCommentAttachment(testPlanID: number, file: File): Promise<CommentAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  const { data, error } = await apiClient.POST("/v1/test-plans/{testPlanID}/comments/attachments", {
    params: { path: { testPlanID } },
    body: formData as never,
    bodySerializer: (body) => body as unknown as FormData,
  });
  if (error || !data) {
    throw new Error(error?.detail || error?.title || "Failed to upload attachment");
  }
  return data;
}

// Attachments need the auth header, so the image is fetched as a blob and shown through an object URL
export function useCommentAttachmentImage(testPlanID: number, attachmentID?: string) {
  const query = useQuery({
    queryKey: ["comment-attachment", testPlanID, attachmentID],
    enabled: !!attachmentID,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await apiClient.GET("/v1/test-plans/{testPlanID}/comments/attachments/{attachmentID}", {
        params: { path: { testPlanID, attachmentID: attachmentID! } },
        parseAs: "blob",
      });
      if (!res.response.ok || !res.data) {
        throw new Error("Failed to load attachment");
      }
      return res.data as Blob;
    },
  });

  const [objectUrl, setObjectUrl] = useState<string>();
  useEffect(() => {
    if (!query.data) return;
    const url = URL.createObjectURL(query.data);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [query.data]);

  return { src: objectUrl, isLoading: query.isLoading, isError: query.isError };
}

export function useLinkPreviewQuery(url: string) {
  return $api.useQuery(
    "get",
    "/v1/link-preview",
    { params: { query: { url } } },
    { staleTime: 60 * 60 * 1000, retry: false }
  );
}

export async function getTestPlanComments(testPlanID: number): Promise<CommentListResponse> {
  const res = await apiClient.request("get", "/v1/test-plans/{testPlanID}/comments", {
    params: { path: { testPlanID } },
  });
  return res.data as CommentListResponse;
}

export async function createComment(testPlanID: number, body: { user_id: number; content: string }) {
  return apiClient.request("post", "/v1/test-plans/{testPlanID}/comments", {
    params: { path: { testPlanID } },
    body: {
      ...body, test_plan_id: testPlanID,
    },
  });
}

export async function deleteComment(testPlanID: number, commentID: string) {
  return apiClient.request("delete", "/v1/test-plans/{testPlanID}/comments/{commentID}", {
    params: { path: { testPlanID, commentID } },
  });
}

export async function convertCommentToTestCase(testPlanID: number, commentID: string) {
  return apiClient.request("post", "/v1/test-plans/{testPlanID}/comments/{commentID}/convert", {
    params: { path: { testPlanID, commentID } },
  });
}


// export async function removeTestersFromTestPlan(
//   testPlanID: string,
//   userIDs: string[]
// ) {
//   return apiClient.request("post", "/v1/test-plans/{testPlanID}/remove-testers", {
//     params: { path: { testPlanID } },
//     body: { userIDs },
//   });
// }
