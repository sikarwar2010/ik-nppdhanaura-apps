/** Lightweight skeleton shown while a page streams in. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="container-site animate-pulse py-10">
      <div className="h-4 w-40 rounded bg-line" />
      <div className="mt-4 h-9 w-2/3 max-w-xl rounded bg-line" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-white ring-1 ring-line" />
        ))}
      </div>
    </div>
  )
}
