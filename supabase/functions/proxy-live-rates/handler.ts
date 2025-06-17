export async function handleRequest(): Promise<Response> {
  return new Response(
    JSON.stringify({
      debug: true,
      version: "v999-hotpatch",
      token: "a45f3fb4ba674d089a2484adf5bd9262",
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
