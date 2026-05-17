export function UnsupportedBrowser() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">
        Browser not supported
      </h1>
      <p className="text-sm leading-relaxed text-zinc-500">
        Your browser does not support native voice recognition. Please use
        Google Chrome, Microsoft Edge, or Safari.
      </p>
    </main>
  );
}
