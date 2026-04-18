import { redirect } from "next/navigation";

import { routes } from "@/shared/config/routes";

export default function AuthorsPage() {
  redirect(routes.home);
}
