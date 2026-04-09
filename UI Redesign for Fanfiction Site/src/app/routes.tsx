import { createBrowserRouter } from "react-router";
import Catalog from "./pages/Catalog";
import StoryDetail from "./pages/StoryDetail";
import Workshop from "./pages/Workshop";
import StorySettings from "./pages/StorySettings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Catalog,
  },
  {
    path: "/story/:id",
    Component: StoryDetail,
  },
  {
    path: "/workshop",
    Component: Workshop,
  },
  {
    path: "/story/:id/settings",
    Component: StorySettings,
  },
]);
