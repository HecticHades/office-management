export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-blueprint relative flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-stone-200/60 to-transparent" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
