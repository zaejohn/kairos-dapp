import { WalletConnect } from "@/components/wallet-connect";
import { getMidnightNetwork } from "@/lib/midnight/config";

const principles = [
  "Evidence before assumptions",
  "One writer, parallel readers",
  "Scoped AGENTS.md instructions",
  "Compiler + tests before claims",
  "Pinned Midnight compatibility",
];

export default function Home() {
  const network = getMidnightNetwork();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <section className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
          Codex × Midnight
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          A small, verifiable base for long-running agentic development.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-300">
          One Next.js application, a pinned Midnight toolchain, bounded multi-agent roles, and verification gates that make unsupported assumptions harder to ship.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="mb-4 text-sm text-zinc-400">Wallet target</p>
          <WalletConnect network={network} />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="mb-4 text-sm text-zinc-400">Operating principles</p>
          <ul className="space-y-3">
            {principles.map((principle) => (
              <li key={principle} className="flex items-center gap-3 text-zinc-200">
                <span aria-hidden className="size-1.5 rounded-full bg-zinc-500" />
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-sm text-zinc-500">
        Replace the demo contract and landing page; keep the agent, verification, and integration boundaries.
      </p>
    </main>
  );
}
