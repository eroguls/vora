import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-md text-xl font-semibold tracking-normal text-neutral-950" aria-label="Vora ana sayfa">
      <span className="vora-gradient flex h-8 w-8 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm shadow-cyan-900/20">V</span>
      <span className="bg-gradient-to-r from-neutral-950 via-[#008cff] to-rose-700 bg-clip-text text-transparent dark:from-white dark:via-[#00e5ff] dark:to-rose-400">Vora</span>
    </Link>
  );
}
