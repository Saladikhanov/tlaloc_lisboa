import { Suspense } from "react";
import PublicNav from "@/components/public-nav";
import ReserveFlow from "@/components/reserve-flow";

export default function ReservePage() {
  return (
    <>
      <PublicNav />
      <Suspense fallback={<main id="main-content" className="site-shell form-shell" />}>
        <ReserveFlow />
      </Suspense>
    </>
  );
}
