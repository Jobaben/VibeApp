import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="page-shell">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
