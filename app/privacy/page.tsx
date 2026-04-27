import "./privacy.css";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import LegalDocumentRenderer from "@/components/legal/LegalDocumentRenderer";
import { fetchPublicSystemSettings } from "@/services/publicSystemSettings";

export default async function PrivacyPage() {
  let content = '';

  try {
    const settings = await fetchPublicSystemSettings();
    content = String(settings.privacy_policy || '').trim();
  } catch {
    content = '';
  }

  return (
    <div className="legal-page">
      <LandingHeader />
      <main className="legal-main">
        <h1 className="legal-page-title">سياسة الخصوصية</h1>
        <LegalDocumentRenderer rawContent={content} />
      </main>
      <LandingFooter />
    </div>
  );
}
