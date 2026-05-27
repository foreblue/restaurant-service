import { createPublicApiClient } from "@/shared/api/publicApiClient";

import { getPublicMemberById, getPublicMembers } from "./publicMemberApi";

describe("publicMemberApi", () => {
  it("requests public members", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ members: [] }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicMembers(client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/members",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests a member by id for ID-only login", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createPublicApiClient({ baseUrl: "http://api.test", fetcher });

    await getPublicMemberById(1, client);

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/api/public/members/1",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
