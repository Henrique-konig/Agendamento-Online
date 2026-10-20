import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="ring-ink-200/70 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xs ring-1">
        {children}
      </div>
    </main>
  );
}
