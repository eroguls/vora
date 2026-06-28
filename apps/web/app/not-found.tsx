import Link from 'next/link';

export default function NotFound() {
  return <main className="mx-auto max-w-md p-6"><h1 className="text-2xl font-semibold">Bulunamadı</h1><p className="mt-2 text-neutral-600">Bu sayfa veya içerik yayında değil.</p><Link className="mt-4 inline-block text-cyan-700" href="/">Ana akışa dön</Link></main>;
}
