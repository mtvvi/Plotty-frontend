import { redirect } from "next/navigation";

import { routes } from "@/shared/config/routes";

export default function RecommendationsPage() {
  redirect(routes.home);
}
