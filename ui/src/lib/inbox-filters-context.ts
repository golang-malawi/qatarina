import { createContext, useContext } from "react";
import { emptyInboxFilters, type InboxFilters } from "@/data/queries/test-cases";

// The filters chosen in the inbox toolbar, shared with the test case page so
// Previous/Next move through the same list the user sees
export const InboxFiltersContext = createContext<InboxFilters>(emptyInboxFilters);

export function useInboxFilters() {
  return useContext(InboxFiltersContext);
}
