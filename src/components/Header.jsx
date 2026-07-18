export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-brand">One</span>
            <span className="text-accent">Ride</span>
          </span>
        </div>

        <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
          NYC metro only
        </div>
      </div>
    </header>
  );
}
