import Image from "next/image";
import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="header-inner">
        <div className="header-brand">
          <Link href="/landing" aria-label="ناس مصر">
            <div className="header-logo-card">
              <Image src="/nas-masr.png" alt="ناس مصر" width={128} height={72} className="header-logo" />
            </div>
          </Link>
        </div>
        <nav className="header-nav">
          <a href="/landing#features" className="header-link">المزايا</a>
          <a href="/landing#stats" className="header-link">الإحصائيات</a>
          <a href="/landing#download" className="header-link">تواصل</a>
        </nav>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/landing" aria-label="ناس مصر">
            <div className="footer-logo-card">
              <Image src="/nas-masr.png" alt="ناس مصر" width={76} height={42} className="footer-logo" />
            </div>
          </Link>
          <div className="footer-text">
            <div className="footer-subtitle">منصّة الإدارة الذكية للإعلانات</div>
          </div>
        </div>
        <div className="footer-credit">
          <span>تم التطوير من قبل شركة دوام</span>
          <Image src="/dwam-logo.jpg" alt="شركة دوام" width={34} height={34} className="footer-credit-logo" />
        </div>
        <div className="footer-links">
          <Link href="/terms" className="footer-link">الشروط والأحكام</Link>
          <Link href="/privacy" className="footer-link">سياسة الخصوصية</Link>
        </div>
      </div>
    </footer>
  );
}
