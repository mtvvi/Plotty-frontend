import { PublicCollectionScreen } from "@/widgets/profile/public-collection-screen";

export default async function UserCollectionPage({
  params,
}: {
  params: Promise<{ username: string; collectionId: string }>;
}) {
  const { username, collectionId } = await params;

  return <PublicCollectionScreen username={decodeURIComponent(username)} collectionId={collectionId} />;
}
