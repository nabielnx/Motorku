// Entity endpoints may retain their HTTP envelope or be unwrapped by bootstrap.
// Pagination endpoints must keep their data + meta and do not use this adapter.
export function entityPayload(response) {
    return response.data?.data ?? response.data;
}
