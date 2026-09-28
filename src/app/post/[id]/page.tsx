import { notFound } from "next/navigation";
import { PostCard } from "@/components/feed/PostCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPostById } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const viewer = await getCurrentProfile();
  const post = await getPostById(viewer.id, id);
  if (!post) notFound();
  return <div className="flex flex-col gap-4"><PageHeader title="Momento" subtitle="Uma lembrança compartilhada com carinho." /><PostCard post={post} viewer={{ id: viewer.id, username: viewer.username, displayName: viewer.displayName, avatarUrl: viewer.avatarUrl }} /></div>;
}
