import "./terms.css";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import LegalDocumentRenderer from "@/components/legal/LegalDocumentRenderer";
import { fetchPublicSystemSettings } from "@/services/publicSystemSettings";

export default async function TermsPage() {
  let content = '';

  try {
    const settings = await fetchPublicSystemSettings();
    content = String(settings['terms_conditions-main_'] || '').trim();
  } catch {
    content = '';
  }

  return (
    <div className="legal-page">
      <LandingHeader />
      <main className="legal-main">
        <h1 className="legal-page-title">الشروط والأحكام</h1>
        <LegalDocumentRenderer rawContent={content} />
      </main>
      <LandingFooter />
    </div>
  );
}
