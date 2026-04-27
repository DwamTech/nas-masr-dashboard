"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import "./landing.css";
import { FiSmartphone, FiMessageSquare, FiSearch, FiLock, FiZap, FiShield, FiBell, FiMapPin, FiChevronDown, FiCheckCircle, FiUploadCloud } from "react-icons/fi";
import { FaAndroid, FaGem, FaStar, FaHeart, FaRocket, FaMagic } from "react-icons/fa";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";

const LANDING_CATEGORIES = [
  { id: 1, name: 'إيجار السيارات'},
  { id: 2, name: 'عقارات' },
  { id: 3, name: 'السيارات' },
  { id: 4, name: 'قطع غيار السيارات' },
  { id: 36, name: 'طيور وحيوانات' },
  { id: 5, name: 'المدرسين' },
  { id: 6, name: 'أطباء'},
  { id: 7, name: 'الوظائف' },
  { id: 8, name: 'منتجات غذائية' },
  { id: 9, name: 'المطاعم' },
  { id: 10, name: 'المتاجر والمولات' },
  { id: 11, name: 'محلات غذائية' },
  { id: 12, name: 'خدمات وصيانة المنازل' },
  { id: 13, name: 'الأثاث'},
  { id: 14, name: 'أدوات منزلية'},
  { id: 15, name: 'الأجهزة المنزلية' },
  { id: 16, name: 'إلكترونيات' },
  { id: 17, name: 'الصحة' },
  { id: 18, name: 'التعليم' },
  { id: 19, name: 'الشحن والتوصيل' },
  { id: 20, name: 'الملابس الرجالية والأحذية' },
  { id: 21, name: 'نقل ومعدات ثقيلة' },
  { id: 22, name: 'مستلزمات ولعب أطفال' },
  { id: 23, name: 'المهن الحرة والخدمات' },
  { id: 24, name: 'الساعات والمجوهرات' },
  { id: 25, name: 'خدمات وصيانة السيارات'},
  { id: 26, name: 'الصيانة العامة' },
  { id: 27, name: 'أدوات البناء' },
  { id: 28, name: 'جيمات' },
  { id: 29, name: 'دراجات ومركبات خفيفة' },
  { id: 30, name: 'مواد وخطوط إنتاج'},
  { id: 31, name: 'منتجات مزارع ومصانع' },
  { id: 32, name: 'الإضاءة والديكور' },
  { id: 33, name: 'مفقودين' },
  { id: 34, name: 'عدد ومستلزمات' },
  { id: 35, name: 'بيع الجملة' },
];

const WHY_POINTS = [
  'نشر في أقل من دقيقة',
  'بحث وفلاتر ذكية',
  'دردشة آمنة داخل التطبيق',
  'توثيق الحسابات',
  'بلاغات وحماية من السبام',
  'الباقات: مجاني • باقات تمييز • باقات شركات',
];

const STORE_LINKS = {
  appStore: 'https://apps.apple.com/eg/app/%D9%86%D8%A7%D8%B3-%D9%85%D8%B5%D8%B1/id6759855668',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.nasmasr.app',
};

export default function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const fadeInMs = 400;
  const viewMs = 1400;
  const fadeOutMs = 300;
  const catsGridRef = useRef<HTMLDivElement | null>(null);
  const [catsInView, setCatsInView] = useState(false);
  const whyGridRef = useRef<HTMLDivElement | null>(null);
  const [whyInView, setWhyInView] = useState(false);
  const [selectedCatIdx, setSelectedCatIdx] = useState<number>(0);

  useEffect(() => {
    if (phase !== 'in') return;
    const toOut = setTimeout(() => setPhase('out'), fadeInMs + viewMs);
    return () => clearTimeout(toOut);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'out') return;
    const toNext = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % LANDING_CATEGORIES.length);
      setPhase('in');
    }, fadeOutMs);
    return () => clearTimeout(toNext);
  }, [phase]);

  useEffect(() => {
    const el = catsGridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e && e.isIntersecting) {
          setCatsInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = whyGridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e && e.isIntersecting) {
          setWhyInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-bg">
        <div className="landing-orb orb-a" />
        <div className="landing-orb orb-b" />
        <div className="landing-orb orb-c" />
        <div className="landing-mesh" />
      </div>
      <LandingHeader />

      <section className="landing-hero" id="home">
        <div className="hero-floating-icons">
          <span className="hi hi-mobile"><FiSmartphone /></span>
          <span className="hi hi-android"><FaAndroid /></span>
          <span className="hi hi-chat"><FiMessageSquare /></span>
          <span className="hi hi-search"><FiSearch /></span>
        </div>
        <div className="hero-content">
          <div className="brand">
            {/* <div className="brand-logo">
              <Image src="/nas-masr.png" alt="ناس مصر" width={120} height={120} />
            </div> */}
            <div className="hero-kicker">
              <FiZap />
              <span>منصة إعلانات مصرية لكل احتياجاتك</span>
            </div>
            <h1 className="hero-title">ناس مصر</h1>
            <h2 className="hero-title alt animate-text">بيع، اشتري، أعلن وتواصل بسهولة</h2>
            <p className="hero-subtitle">
              انشر إعلانك في دقيقة، وابحث وسط عشرات الأقسام بتجربة سريعة وآمنة على الموبايل.
            </p>
            <div className="hero-actions">
              <div className="download-actions">
                <a href={STORE_LINKS.googlePlay} className="store-badge play" aria-label="تحميل ناس مصر من Google Play" target="_blank" rel="noopener noreferrer">
                  <Image src="/google.png" alt="Google Play" width={42} height={42} className="store-logo" />
                  <span className="store-text">
                    <strong>Google Play</strong>
                    <em>حمّل الآن</em>
                  </span>
                </a>
                <a href={STORE_LINKS.appStore} className="store-badge appstore" aria-label="تحميل ناس مصر من App Store" target="_blank" rel="noopener noreferrer">
                  <Image src="/app-store.png" alt="App Store" width={42} height={42} className="store-logo" />
                  <span className="store-text">
                    <strong>App Store</strong>
                    <em>حمّل الآن</em>
                  </span>
                </a>
              </div>
              <div className="hero-proof-points" aria-label="مزايا سريعة">
                <span><FiCheckCircle /> نشر سريع</span>
                <span><FiShield /> تواصل آمن</span>
                <span><FiUploadCloud /> إدارة إعلاناتك</span>
              </div>
              {/* <Link href="/ads/create" className="landing-btn primary">
                <span>ابدأ نشر إعلان</span>
                <span className="btn-shine" />
              </Link> */}
              <div className="hero-categories-title">يضم التطبيق العديد من المجالات</div>
              <div className="hero-category-rotator">
                <div className={`rotator-item ${phase}`}>
                  {LANDING_CATEGORIES[currentIndex].name}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
            <div className="device-mockup">
              <div className="device-frame">
                <div className="device-notch"></div>
                <div className="device-screen">
                  <Image src="/home.png" alt="لقطة تطبيق ناس مصر" width={360} height={1200} className="screen-image" />
                </div>
              </div>
              <div className="scroll-indicator">
              <span className="scroll-arrow"><FiChevronDown /></span>
              <span className="scroll-text">يمكنك السحب داخل شاشة الهاتف</span>
            </div>
              <div className="device-glow"></div>
            </div>
          </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">مزايا تطبيق ناس مصر</h2>
          <p className="section-subtitle">تجربة موبايل عربية سلسة وسريعة وآمنة</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><FiSearch /></div>
            <h3 className="feature-title">بحث ذكي</h3>
            <p className="feature-desc">اعثر على ما تريده بسرعة مع اقتراحات فورية.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiMessageSquare /></div>
            <h3 className="feature-title">دردشة فورية</h3>
            <p className="feature-desc">تواصل مباشرة مع البائعين عبر رسائل سريعة.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiBell /></div>
            <h3 className="feature-title">إشعارات لحظية</h3>
            <p className="feature-desc">تابع الردود والعروض والتنبيهات فور حدوثها.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiLock /></div>
            <h3 className="feature-title">خصوصية</h3>
            <p className="feature-desc">حماية بياناتك وتحكم كامل في إعدادات الخصوصية.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiZap /></div>
            <h3 className="feature-title">أداء سريع</h3>
            <p className="feature-desc">تحميل خفيف وحركات سلسة على الأجهزة المختلفة.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiMapPin /></div>
            <h3 className="feature-title">تحديد موقع تلقائي</h3>
            <p className="feature-desc">إعلانات وخدمات بحسب موقعك الحالي.</p>
          </div>
        </div>
      </section>


      <section className="stats-section" id="stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">25K+</div>
            <div className="stat-label">مستخدمين</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">1.2M</div>
            <div className="stat-label">مشاهدات</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">35+</div>
            <div className="stat-label">أقسام</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">99.9%</div>
            <div className="stat-label">إتاحة</div>
          </div>
        </div>
      </section>

      <section className="categories-section" id="categories">
        <div className="section-header">
          <h2 className="section-title">الأقسام</h2>
          <p className="section-subtitle">مجالات متعددة تغطي احتياجاتك</p>
        </div>
        <div className="categories-grid" ref={catsGridRef} role="tablist" aria-label="الأقسام">
          {LANDING_CATEGORIES.map((cat, idx) => (
            <button
              type="button"
              key={cat.id}
              className={`category-card${catsInView ? ' in' : ''}${selectedCatIdx === idx ? ' active' : ''}`}
              style={{ animationDelay: `${idx * 100}ms` }}
              role="tab"
              aria-selected={selectedCatIdx === idx}
              onClick={() => { setSelectedCatIdx(idx); setCurrentIndex(idx); setPhase('in'); }}
            >
              <span className="category-name">{cat.name}</span>
              <span className="card-shine" />
            </button>
          ))}
        </div>
      </section>

      <section className="why-section" id="why">
        <div className="why-floating-icons">
          <span className="fi fi-search"><FiSearch /></span>
          <span className="fi fi-chat"><FiMessageSquare /></span>
          <span className="fi fi-lock"><FiLock /></span>
          <span className="fi fi-speed"><FiZap /></span>
          <span className="fi fi-shield"><FiShield /></span>
          <span className="fi fi-diamond"><FaGem /></span>
        </div>
        <div className="section-header">
          <h2 className="section-title">لماذا هذا التطبيق ؟</h2>
          <p className="section-subtitle">مزايا عملية تختصر الوقت وتزيد الأمان</p>
        </div>
        <div className="why-grid">
          <div className="why-cards-stack" ref={whyGridRef}>
            {WHY_POINTS.map((txt, idx) => (
              <div
                key={idx}
                className={`why-item${whyInView ? ' in' : ''}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="why-count">{String(idx + 1).padStart(2, '0')}</span>
                <span className="why-text">{txt}</span>
                <span className="card-shine" />
              </div>
            ))}
          </div>
          <div className="why-phone-preview">
            <div className="device-mockup">
              <div className="device-frame">
                <div className="device-notch"></div>
                <div className="device-screen">
                  <Image src="/home2.jfif" alt="لقطة تطبيق ناس مصر" width={360} height={1200} className="screen-image" />
                </div>
              </div>
              {/* <div className="scroll-indicator">
                <span className="scroll-arrow">⬇</span>
                <span className="scroll-text">يمكنك السحب داخل شاشة الهاتف</span>
              </div> */}
              <div className="device-glow"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="promo-section" id="download">
        <div className="promo-icons">
          <span className="pi pi-star"><FaStar /></span>
          <span className="pi pi-heart"><FaHeart /></span>
          <span className="pi pi-rocket"><FaRocket /></span>
          <span className="pi pi-sparkles"><FaMagic /></span>
        </div>
        <div className="promo-inner">
          <div className="promo-content">
            <h2 className="promo-title">حمّل تطبيق ناس مصر الآن</h2>
            <p className="promo-subtitle">تجربة عربية عصرية سريعة وآمنة على هاتفك</p>
            <div className="promo-actions">
              <a href={STORE_LINKS.googlePlay} className="store-badge play" aria-label="تحميل ناس مصر من Google Play" target="_blank" rel="noopener noreferrer">
                <Image src="/google.png" alt="Google Play" width={42} height={42} className="store-logo" />
                <span className="store-text">
                  <strong>Google Play</strong>
                  <em>حمّل الآن</em>
                </span>
              </a>
              <a href={STORE_LINKS.appStore} className="store-badge appstore" aria-label="تحميل ناس مصر من App Store" target="_blank" rel="noopener noreferrer">
                <Image src="/app-store.png" alt="App Store" width={42} height={42} className="store-logo" />
                <span className="store-text">
                  <strong>App Store</strong>
                  <em>حمّل الآن</em>
                </span>
              </a>
            </div>
            <div className="promo-highlights">
              <span className="promo-pill">نشر في دقيقة</span>
              <span className="promo-pill">دردشة آمنة</span>
              <span className="promo-pill">بحث ذكي</span>
            </div>
          </div>
         
        </div>
      </section>
 
      <LandingFooter />
    </div>
  );
}
