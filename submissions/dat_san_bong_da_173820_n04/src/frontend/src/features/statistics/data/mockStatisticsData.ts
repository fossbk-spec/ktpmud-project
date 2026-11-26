import type { MatchResponse } from "../../matchmaking/types/matchmaking.types";
import type { TournamentTeam } from "../types/statistics.types";

export const mockTeams: TournamentTeam[] = [
  { id: 1, name: "FC Bách Khoa" },
  { id: 2, name: "Thành Phát United" },
  { id: 3, name: "Mỹ Đình Stars" },
  { id: 4, name: "Đông Đô FC" },
  { id: 5, name: "Thủy Lợi VIP" },
  { id: 6, name: "Cầu Giấy Boys" },
];

export const mockRoundRobinMatches: MatchResponse[] = [
  // Round 1
  {
    id: 101, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 1, hostTeamName: "FC Bách Khoa", guestTeamId: 6, guestTeamName: "Cầu Giấy Boys",
    skillLevel: "AVERAGE", matchTime: "2026-06-10T18:00:00", status: "COMPLETED", homeScore: 3, awayScore: 1, roundNumber: 1
  },
  {
    id: 102, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 2, hostTeamName: "Thành Phát United", guestTeamId: 5, guestTeamName: "Thủy Lợi VIP",
    skillLevel: "AVERAGE", matchTime: "2026-06-10T19:30:00", status: "COMPLETED", homeScore: 2, awayScore: 2, roundNumber: 1
  },
  {
    id: 103, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 3, hostTeamName: "Mỹ Đình Stars", guestTeamId: 4, guestTeamName: "Đông Đô FC",
    skillLevel: "AVERAGE", matchTime: "2026-06-11T18:00:00", status: "COMPLETED", homeScore: 0, awayScore: 1, roundNumber: 1
  },
  // Round 2
  {
    id: 104, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 6, hostTeamName: "Cầu Giấy Boys", guestTeamId: 4, guestTeamName: "Đông Đô FC",
    skillLevel: "AVERAGE", matchTime: "2026-06-17T18:00:00", status: "COMPLETED", homeScore: 1, awayScore: 4, roundNumber: 2
  },
  {
    id: 105, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 5, hostTeamName: "Thủy Lợi VIP", guestTeamId: 3, guestTeamName: "Mỹ Đình Stars",
    skillLevel: "AVERAGE", matchTime: "2026-06-17T19:30:00", status: "COMPLETED", homeScore: 3, awayScore: 0, roundNumber: 2
  },
  {
    id: 106, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 1, hostTeamName: "FC Bách Khoa", guestTeamId: 2, guestTeamName: "Thành Phát United",
    skillLevel: "AVERAGE", matchTime: "2026-06-18T18:00:00", status: "SCHEDULED", roundNumber: 2
  },
  // Round 3 (Upcoming)
  {
    id: 107, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 2, hostTeamName: "Thành Phát United", guestTeamId: 6, guestTeamName: "Cầu Giấy Boys",
    skillLevel: "AVERAGE", matchTime: "2026-06-24T18:00:00", status: "SCHEDULED", roundNumber: 3
  },
];

export const mockKnockoutMatches: MatchResponse[] = [
  // Quarter Finals (Round 1)
  {
    id: 201, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 1, hostTeamName: "FC Bách Khoa", guestTeamId: 6, guestTeamName: "Cầu Giấy Boys",
    skillLevel: "AVERAGE", matchTime: "2026-06-10T18:00:00", status: "COMPLETED", homeScore: 2, awayScore: 0, roundNumber: 1, nextMatchId: 205
  },
  {
    id: 202, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 2, hostTeamName: "Thành Phát United", guestTeamId: 5, guestTeamName: "Thủy Lợi VIP",
    skillLevel: "AVERAGE", matchTime: "2026-06-10T19:30:00", status: "COMPLETED", homeScore: 1, awayScore: 3, roundNumber: 1, nextMatchId: 205
  },
  {
    id: 203, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 3, hostTeamName: "Mỹ Đình Stars", guestTeamId: 4, guestTeamName: "Đông Đô FC",
    skillLevel: "AVERAGE", matchTime: "2026-06-11T18:00:00", status: "COMPLETED", homeScore: 0, awayScore: 1, roundNumber: 1, nextMatchId: 206
  },
  {
    id: 204, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 0, hostTeamName: "", guestTeamId: null, guestTeamName: "",
    skillLevel: "AVERAGE", matchTime: "2026-06-11T19:30:00", status: "CANCELLED", roundNumber: 1, nextMatchId: 206
  },
  
  // Semi Finals (Round 2)
  {
    id: 205, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 1, hostTeamName: "FC Bách Khoa", guestTeamId: 5, guestTeamName: "Thủy Lợi VIP",
    skillLevel: "AVERAGE", matchTime: "2026-06-17T18:00:00", status: "COMPLETED", homeScore: 1, awayScore: 2, roundNumber: 2, nextMatchId: 207
  },
  {
    id: 206, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 4, hostTeamName: "Đông Đô FC", guestTeamId: null, guestTeamName: "",
    skillLevel: "AVERAGE", matchTime: "2026-06-17T19:30:00", status: "SCHEDULED", roundNumber: 2, nextMatchId: 207
  },

  // Final (Round 3)
  {
    id: 207, venueId: 1, venueName: "Cụm Sân Bóng Đá Bách Khoa", hostTeamId: 5, hostTeamName: "Thủy Lợi VIP", guestTeamId: null, guestTeamName: "",
    skillLevel: "AVERAGE", matchTime: "2026-06-24T18:00:00", status: "SCHEDULED", roundNumber: 3
  },
];
