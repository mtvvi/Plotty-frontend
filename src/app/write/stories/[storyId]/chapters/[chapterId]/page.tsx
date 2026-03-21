import { StoryEditorScreen } from "@/widgets/stories/story-editor-screen";

export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ storyId: string; chapterId: string }>;
}) {
  const { storyId, chapterId } = await params;

  return <StoryEditorScreen storyId={storyId} chapterId={chapterId} />;
}
