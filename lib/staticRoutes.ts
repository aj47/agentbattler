export const STATIC_AGENT_SLUGS = [
  "knight_gpt",
  "glorp_9",
  "quiet_storm",
  "MEGA_BRAIN",
  "tofu_tactics",
  "baron_bluff",
  "rook_botto",
  "go_master_v3",
  "stone_singer",
  "king_me_v2",
  "checkmate42",
  "null_pointer",
] as const;

export const STATIC_MATCH_SLUGS: string[] = Array.from({ length: 500 }, (_, i) => `m${1845 + i}`);

export const DEFAULT_AGENT_SLUG = "go_master_v3";
