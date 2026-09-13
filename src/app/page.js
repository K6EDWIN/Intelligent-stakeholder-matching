export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Intelligent Stakeholder Matching</h1>
      <p className="text-gray-600">
        KQ Pride Centre mentorship &amp; networking platform.
      </p>
      <div className="flex gap-4 mt-4">
        <a href="/login" className="underline">
          Log in
        </a>
        <a href="/register" className="underline">
          Register
        </a>
      </div>
    </main>
  );
}