import { StoryDetailsScreen } from "@/widgets/stories/story-details-screen";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <StoryDetailsScreen slug={slug} />;
}
