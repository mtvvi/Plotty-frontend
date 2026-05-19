import { ChapterReaderScreen } from "@/widgets/stories/chapter-reader-screen";

export default async function ChapterPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  const { slug, chapterId } = await params;

  return <ChapterReaderScreen slug={slug} chapterId={chapterId} />;
}
