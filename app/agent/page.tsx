import { redirect } from "next/navigation";
import { DEFAULT_AGENT_SLUG } from "../../lib/staticRoutes";

export default function AgentIndex() {
  redirect(`/agent/${DEFAULT_AGENT_SLUG}`);
}
