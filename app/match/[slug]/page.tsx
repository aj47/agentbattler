import MatchPageClient from "./MatchPageClient";
import { STATIC_MATCH_SLUGS } from "../../../lib/staticRoutes";

export function generateStaticParams() {
  return STATIC_MATCH_SLUGS.map(slug => ({ slug }));
}

export default async function MatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MatchPageClient slug={slug} />;
}
