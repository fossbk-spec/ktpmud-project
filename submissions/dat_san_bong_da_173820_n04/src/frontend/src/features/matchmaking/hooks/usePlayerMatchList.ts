import { useState } from "react";

import logoBall from "../../../assets/images/logo-ball.jpg";
import type { PlayerMatchItem } from "../types/matchmaking.types";

const initialMatches: PlayerMatchItem[] = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `pm-${index + 1}`,
    player: "Đội Bóng Phong Trào Hà Nội",
    field: "Cụm Sân Bóng Đá Bách Khoa",
    time: "17h30 – 19h00",
    avatar: logoBall,
  }),
);

export function usePlayerMatchList() {
  const [matches] = useState<PlayerMatchItem[]>(initialMatches);
  const [isLoading] = useState(false);

  return { matches, isLoading };
}
