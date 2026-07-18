import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function Shell({
  children,
  bare = false,
}: {
  children: React.ReactNode;
  bare?: boolean;
}) {
  if (bare) return <>{children}</>;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
