export default async function Home() {
  // FIXME: waiting for homepage. For now redirect to /app
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/app",
    },
  });
}
