import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
      <h1 className="text-4xl md:text-6xl font-black mb-4">
        AI Indian Trip <span className="text-amber-400">Planner</span>
      </h1>
      <p className="text-slate-400 max-w-md mb-8 text-lg">
        Custom itineraries tailored to INR budgets, train/cab routes, and dietary preferences.
      </p>
      <Link
        href="/planner"
        className="bg-amber-400 text-slate-950 font-bold px-8 py-4 rounded-xl text-lg hover:bg-amber-500 transition-all"
      >
        Start Planning Your Trip →
      </Link>
    </main>
  );
}