export default function IdleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {children}
    </div>
  );
}
