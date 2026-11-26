import type { InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import { localMockAdapter, resetStaticDemoDatabase } from "../localMockAdapter";

function makeConfig(
  method: string,
  url: string,
  data?: unknown,
  token?: string,
  params?: Record<string, unknown>,
): InternalAxiosRequestConfig {
  const headers = new AxiosHeaders();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return {
    method,
    url,
    data,
    params,
    headers,
  } as InternalAxiosRequestConfig;
}

describe("localMockAdapter (GitHub Pages Zero-DB Engine)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStaticDemoDatabase();
  });

  it("loads 10 seeded Hanoi complexes and 6 time slots without backend", async () => {
    const res = await localMockAdapter(makeConfig("GET", "/player/venues"));
    expect(res.status).toBe(200);
    expect(res.data.content).toHaveLength(10);

    const avail = await localMockAdapter(
      makeConfig("GET", "/player/venues/1/availability", undefined, undefined, { date: "2026-12-22" }),
    );
    expect(avail.data.pitches).toHaveLength(2);
    expect(avail.data.pitches[0].slots).toHaveLength(6);
  });

  it("runs complete Client hold -> Deposit report -> Owner confirm -> Stats flow in localStorage", async () => {
    const clientLogin = await localMockAdapter(
      makeConfig("POST", "/auth/login", {
        email: "client@soccerbooker.vn",
        password: "Demo@123",
        role: "PLAYER",
      }),
    );
    const clientToken = clientLogin.data.token as string;
    expect(clientLogin.data.role).toBe("CLIENT");

    const ownerLogin = await localMockAdapter(
      makeConfig("POST", "/auth/login", {
        email: "owner@soccerbooker.vn",
        password: "Demo@123",
        role: "ADMIN",
      }),
    );
    const ownerToken = ownerLogin.data.token as string;
    expect(ownerLogin.data.role).toBe("PITCH_OWNER");

    const booking = await localMockAdapter(
      makeConfig(
        "POST",
        "/player/bookings",
        { pitchId: 2, bookingDate: "2026-12-22", timeSlotId: 1 },
        clientToken,
      ),
    );
    expect(booking.status).toBe(201);
    expect(booking.data.status).toBe("WAITING_FOR_DEPOSIT");

    await expect(
      localMockAdapter(
        makeConfig(
          "POST",
          "/player/bookings",
          { pitchId: 2, bookingDate: "2026-12-22", timeSlotId: 1 },
          clientToken,
        ),
      ),
    ).rejects.toThrow();

    await localMockAdapter(
      makeConfig(
        "POST",
        `/bookings/${booking.data.id}/deposit-reports`,
        { reportedAmount: booking.data.depositAmount, clientMessage: "CK xong" },
        clientToken,
      ),
    );

    await localMockAdapter(
      makeConfig(
        "PATCH",
        `/admin/bookings/${booking.data.id}/status`,
        { status: "BOOKED", adminNote: "Da nhan coc" },
        ownerToken,
      ),
    );

    const adminOrders = await localMockAdapter(
      makeConfig("GET", "/admin/bookings", undefined, ownerToken),
    );
    const updated = adminOrders.data.content.find((b: { id: number }) => b.id === booking.data.id);
    expect(updated.status).toBe("CONFIRMED");
  });
});
