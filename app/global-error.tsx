'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto">
            {error.message || "An unexpected runtime error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl hover:bg-amber-500 transition-all text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}