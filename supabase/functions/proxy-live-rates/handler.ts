export async function handleRequest(): Promise<Response> {
  return new Response(
    JSON.stringify({
      debug: true,
      status: "live",
      version: "linked-and-clean",
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
