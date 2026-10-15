import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createStateStore, emptyState, type StoreState } from "@/persistence/state-store";
import type { AppStore } from "@/persistence/types";

const filePath = path.join(process.cwd(), ".data", "store.json");
const GLOBAL_KEY = "__radVanAvontuurFileStore";

type Holder = {
  state: StoreState;
  mtimeMs: number;
  queue: Promise<void>;
  store: AppStore;
};

function assignState(target: StoreState, source: StoreState) {
  const fresh = emptyState();
  Object.assign(fresh, source);
  target.sessions = fresh.sessions ?? [];
  target.overrides = fresh.overrides ?? [];
  target.promotions = fresh.promotions ?? [];
  target.partners = fresh.partners ?? [];
  target.affiliates = fresh.affiliates ?? [];
  target.reviews = fresh.reviews ?? [];
  target.visited = fresh.visited ?? [];
  target.favorites = fresh.favorites ?? [];
  target.analytics = fresh.analytics ?? [];
  target.quality = fresh.quality ?? [];
}

async function syncFromDisk(holder: Holder) {
  try {
    const info = await stat(filePath);
    if (info.mtimeMs === holder.mtimeMs) return;
    const raw = await readFile(filePath, "utf8");
    assignState(holder.state, JSON.parse(raw) as StoreState);
    holder.mtimeMs = info.mtimeMs;
  } catch {
    if (holder.mtimeMs < 0) holder.mtimeMs = 0;
  }
}

async function persist(holder: Holder) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(holder.state));
  const info = await stat(filePath);
  holder.mtimeMs = info.mtimeMs;
}

function createHolder(): Holder {
  const state = emptyState();
  const holder: Holder = {
    state,
    mtimeMs: -1,
    queue: Promise.resolve(),
    store: null as unknown as AppStore,
  };
  const base = createStateStore(state, "development-file", () => persist(holder));
  holder.store = new Proxy(base, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        const task = holder.queue.then(async () => {
          await syncFromDisk(holder);
          return value.apply(target, args);
        });
        holder.queue = task.then(
          () => undefined,
          () => undefined,
        );
        return task;
      };
    },
  });
  return holder;
}

export function createFileStore(): AppStore {
  const scope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Holder };
  scope[GLOBAL_KEY] ??= createHolder();
  return scope[GLOBAL_KEY].store;
}
