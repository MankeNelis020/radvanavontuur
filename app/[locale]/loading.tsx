import { headers } from "next/headers";
import { LoadingState } from "@/components/status/LoadingState";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function Loading() {
  const headerList = await headers();
  const dict = getDictionary(headerList.get("x-locale") === "nl" ? "nl" : "en");
  return <LoadingState label={dict.status.loading} />;
}
