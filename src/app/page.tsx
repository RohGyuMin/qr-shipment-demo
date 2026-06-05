import Link from "next/link";

export default function Home() {
  const links = [
    { href: "/scan", label: "📷 QR 스캔 (현장)" },
    { href: "/dashboard", label: "📊 대시보드 (관리부서)" },
    { href: "/qr-samples", label: "🔖 샘플 QR" },
  ];
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">출고관리 데모</h1>
      <div className="space-y-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className="block rounded-lg border bg-white p-4 text-lg shadow-sm">
            {l.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
