import { Analytics } from "@/components/Analytics";
import { FunnelProvider } from "@/components/funnel/FunnelProvider";
import { StickyCta } from "@/components/landing/Cta";
import {
  FinalCta,
  Footer,
  ForWhom,
  Hero,
  Organizers,
  Pitch,
  Pricing,
  Program,
  Testimonials,
} from "@/components/landing/Sections";
import { normalizePhone } from "@/lib/phone";
import { getPublicState } from "@/lib/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await getPublicState();
  return (
    <FunnelProvider state={state}>
      <Analytics />
      <main>
        <Hero state={state} />
        <Pitch />
        <ForWhom />
        <Program />
        <Pricing state={state} />
        <Organizers state={state} />
        <Testimonials state={state} />
        <FinalCta state={state} />
      </main>
      <Footer whatsapp={normalizePhone(state.settings.whatsapp_number)} />
      <StickyCta />
    </FunnelProvider>
  );
}
