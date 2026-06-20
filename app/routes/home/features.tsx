export function Features() {
  return (
    <section>
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
          FEATURES
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-[250px]">

          { }
          <div className="lg:row-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Ultra-Fast Loading</h3>
              <p className="text-sm text-muted-foreground">Optimized rendering pipeline for near-instant profile transitions.</p>
            </div>
            <div className="h-40 w-full mt-4 rounded-xl border border-border bg-muted overflow-hidden">
              <img src="" alt="Performance" className="h-full w-full object-cover" />
            </div>
          </div>

          { }
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden">
            <h3 className="font-bold">Theme System</h3>
            <div className="h-20 w-full mt-2 rounded-lg border border-border bg-muted overflow-hidden">
              <img src="" alt="Theme" className="h-full w-full object-cover" />
            </div>
          </div>

          { }
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden">
            <h3 className="font-bold">TypeScript Ready</h3>
            <div className="h-20 w-full mt-2 rounded-lg border border-border bg-muted overflow-hidden">
              <img src="" alt="TS" className="h-full w-full object-cover" />
            </div>
          </div>

          { }
          <div className="md:col-span-2 lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex items-center gap-6 overflow-hidden">
            <div className="h-32 w-32 shrink-0 rounded-xl border border-border bg-muted overflow-hidden">
              <img src="" alt="Security" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold">Production Security</h3>
              <p className="text-sm text-muted-foreground">Hardened code paths with zero external dependency bloat.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}