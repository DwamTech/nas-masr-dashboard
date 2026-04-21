import Image from "next/image";
import Link from "next/link";
import "./privacy.css";
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
      <header className="landing-header">
        <div className="header-inner">
          <div className="header-brand">
            <Link href="/landing">
              <Image src="/nas-masr.png" alt="ناس مصر" width={36} height={36} className="brand-logo" />
            </Link>
          </div>
          <nav className="header-nav">
            <a href="/landing#features" className="header-link">المزايا</a>
            <a href="/landing#stats" className="header-link">الإحصائيات</a>
            <a href="/landing#download" className="header-link">تواصل</a>
          </nav>
        </div>
      </header>
      <main className="legal-main">
        <h1 className="legal-page-title">سياسة الخصوصية</h1>
        <LegalDocumentRenderer rawContent={content} />
      </main>
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link href="/landing">
              <Image src="/nas-masr.png" alt="ناس مصر" width={36} height={36} className="brand-logo" />
            </Link>
            <div className="footer-text">
              <div className="footer-subtitle">منصّة الإدارة الذكية للإعلانات</div>
            </div>
          </div>
          <div className="footer-links">
            <a href="/terms" className="footer-link">الشروط والأحكام</a>
            <a href="/privacy" className="footer-link">سياسة الخصوصية</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
