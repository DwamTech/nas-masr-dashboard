import Image from "next/image";
import Link from "next/link";
import "./terms.css";
import LegalDocumentRenderer from "@/components/legal/LegalDocumentRenderer";
import { fetchPublicSystemSettings } from "@/services/publicSystemSettings";

const FALLBACK_TERMS_CONTENT = `نبذة عامة

باستخدامك لهذا التطبيق، فإنك توافق على الالتزام بهذه الشروط والأحكام. نحتفظ بحق تعديلها في أي وقت، مع إشعار المستخدم بالتحديثات داخل التطبيق.

استخدام التطبيق

يجب استخدام التطبيق لأغراض مشروعة فقط، مع الالتزام بعدم إساءة استخدام الخدمات أو محاولة تعطيلها بأي شكل. يتحمل المستخدم مسؤولية صحة ودقة المعلومات التي يقوم بإدخالها.

إنشاء الحساب والخصوصية

عند إنشاء حساب داخل التطبيق، تلتزم بتقديم معلومات صحيحة ومحدثة. نحرص على حماية بياناتك والتعامل معها وفقًا لسياسة الخصوصية المعتمدة.

المسؤولية وإخلاء المسؤولية

يتم تقديم الخدمات كما هي دون أي ضمانات. ولا نتحمل أي مسؤولية عن الأضرار المباشرة أو غير المباشرة الناتجة عن سوء الاستخدام أو عن أعطال خارجة عن نطاق سيطرتنا.`;

export default async function TermsPage() {
  let content = FALLBACK_TERMS_CONTENT;

  try {
    const settings = await fetchPublicSystemSettings();
    content = String(settings['terms_conditions-main_'] || '').trim() || FALLBACK_TERMS_CONTENT;
  } catch {
    content = FALLBACK_TERMS_CONTENT;
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
        <h1 className="legal-page-title">الشروط والأحكام</h1>
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
