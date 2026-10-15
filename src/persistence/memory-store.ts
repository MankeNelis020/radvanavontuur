import { createStateStore, emptyState } from "@/persistence/state-store";
import type { AppStore } from "@/persistence/types";

export function createMemoryStore(): AppStore {
  return createStateStore(emptyState(), "development-file");
}
