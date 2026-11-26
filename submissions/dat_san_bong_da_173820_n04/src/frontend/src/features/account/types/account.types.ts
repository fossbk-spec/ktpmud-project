export interface PlayerBookingHistoryItem {
  id: number;
  bookingCode?: string;
  pitchId: number;
  pitchName: string;
  venueName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  depositAmount: number;
  status: string;
  expiresAt?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  transferInstruction?: string | null;
  reviewed?: boolean;
  depositReported?: boolean;
}

export interface PlayerProfileInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  teamId: number | null;
  membershipPoints: number;
  walletBalance: number;
  createdAt: string;
}
