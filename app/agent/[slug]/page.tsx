import AgentPageClient from "./AgentPageClient";
import { STATIC_AGENT_SLUGS } from "../../../lib/staticRoutes";

export function generateStaticParams() {
  return STATIC_AGENT_SLUGS.map((slug) => ({ slug }));
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AgentPageClient slug={slug} />;
}