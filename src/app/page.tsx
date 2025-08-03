import InteractiveImageGenerator from "@/components/blocks/interactive-image-generator";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { getLandingPage } from "@/services/page";
import { getTranslations } from "@/lib/translations";

export async function generateMetadata() {
  const t = getTranslations();
  const canonicalUrl = process.env.NEXT_PUBLIC_WEB_URL || '';

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage() {
  const page = await getLandingPage('en'); // 默认使用英文

  return (
    <>
      {page.header && <Header header={page.header} />}
      <main className="overflow-x-hidden">
        {page.branding && <InteractiveImageGenerator section={page.branding} />}
        {page.feature && <Feature section={page.feature} />}
        {page.faq && <FAQ section={page.faq} />}
        {page.cta && <CTA section={page.cta} />}
      </main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}