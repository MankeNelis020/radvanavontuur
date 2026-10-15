import { createFileStore } from "@/persistence/file-store";
import type { AppStore } from "@/persistence/types";
import { createSupabaseStore, supabaseConfigured } from "@/persistence/supabase-store";

const GLOBAL_KEY = "__radVanAvontuurAppStore";

let testStore: AppStore | null = null;

export function setStoreForTests(store: AppStore | null) {
  testStore = store;
}

export function getStore(): AppStore {
  if (testStore) return testStore;
  const scope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: AppStore };
  if (!scope[GLOBAL_KEY]) {
    scope[GLOBAL_KEY] = supabaseConfigured() ? createSupabaseStore() : createFileStore();
  }
  return scope[GLOBAL_KEY];
}

export function storageLabel(store: AppStore): string {
  if (store.mode === "supabase") return "Supabase";
  return "Ontwikkelopslag op deze server. Supabase is niet geconfigureerd; gegevens zijn niet een blijvende cloud-database.";
}
