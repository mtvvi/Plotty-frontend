import { ChapterReaderScreen } from "@/widgets/stories/chapter-reader-screen";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;

  return <ChapterReaderScreen slug={slug} number={number} />;
}
