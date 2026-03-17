'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchAdminStats, fetchRecentActivities } from "@/services/adminStats";
import { fetchAdminNotificationsCount } from "@/services/notifications";
import { logoutDashboard } from "@/services/auth";
import { readDashboardUser } from "@/utils/dashboardSession";

type NavSubItem = { href: string; label: string; icon: string; permissionKey: string };
type NavItem = {
  href: string;
  label: string;
  icon: string;
  permissionKey?: string;
  subItems?: NavSubItem[];
  toggleOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "/window.svg", permissionKey: "dashboard.home" },
  {
    href: "/ads",
    label: "إدارة الإعلانات",
    icon: "/file.svg",
    permissionKey: "ads.list",
    subItems: [
      { href: "/ads/create", label: "إنشاء إعلان", icon: "/file.svg", permissionKey: "ads.create" },
      { href: "/ads/rules", label: "إدارة الباقات", icon: "/globe.svg", permissionKey: "ads.packages" },
      { href: "/moderation", label: "الموافقات والمراجعة", icon: "/star.png", permissionKey: "ads.moderation" },
      { href: "/moderation/unpaid", label: "مراجعة الإعلانات غير المدفوعة", icon: "/star.png", permissionKey: "ads.unpaid" },
    ]
  },
  {
    href: "/categories",
    label: "الأقسام والتصنيفات",
    icon: "/categories.png",
    permissionKey: "categories.index",
    toggleOnly: true,
    subItems: [
      { href: "/category-homepage-management", label: "إدارة أقسام الصفحة الرئيسية", icon: "/categories.png", permissionKey: "categories.homepage" },
      { href: "/app-banners", label: "إدارة بنارات التطبيق", icon: "/categories.png", permissionKey: "categories.banners" },
      { href: "/unified-images", label: "إدارة صور الأقسام", icon: "/categories.png", permissionKey: "categories.images" },
      { href: "/dashboard/filters-lists", label: "إدارة الفلاتر والقوائم", icon: "/categories.png", permissionKey: "categories.filters" }
    ]
  },
  { href: "/users", label: "المستخدمون والموظفون", icon: "/profile.png", permissionKey: "users.index" },
  { href: "/reports", label: "التقارير والإحصائيات", icon: "/clipboard.png", permissionKey: "reports.index" },
  { href: "/notifications", label: "الإشعارات", icon: "/bell.png", permissionKey: "notifications.index" },
  { href: "/messages", label: "الرسائل", icon: "/chat2.png", permissionKey: "messages.index" },
  { href: "/customer-chats", label: "محادثات العملاء", icon: "/chat3.png", permissionKey: "customer-chats.index" },
  { href: "/settings", label: "الضبط العام", icon: "/cogwheel.png", permissionKey: "settings.index" },
  { href: "/admin-account", label: "إدارة الحساب الشخصي", icon: "/profile.png", permissionKey: "account.self" }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState(() => readDashboardUser());
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const allowedKeys = new Set(user?.allowed_dashboard_pages || []);
  const canSeeHome = isAdmin || allowedKeys.has('dashboard.home');
  const canSeeNotifications = isAdmin || allowedKeys.has('notifications.index');

  useEffect(() => {
    const syncUser = () => setUser(readDashboardUser());
    window.addEventListener('dashboard-user-updated', syncUser);
    return () => window.removeEventListener('dashboard-user-updated', syncUser);
  }, []);

  const isAllowed = (permissionKey?: string) => {
    if (!permissionKey) return true;
    return isAdmin || allowedKeys.has(permissionKey);
  };

  const visibleNavItems = navItems
    .map((item) => {
      const subItems = (item.subItems || []).filter((sub) => isAllowed(sub.permissionKey));
      const showItem = isAllowed(item.permissionKey) || subItems.length > 0;
      return showItem ? { ...item, subItems } : null;
    })
    .filter((item): item is NavItem => Boolean(item));

  const toggleDropdown = (href: string) => {
    setOpenDropdowns(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  useEffect(() => {
    const activeParents = visibleNavItems
      .filter((item) => {
        if (!Array.isArray(item.subItems) || item.subItems.length === 0) {
          return false;
        }
        return item.subItems.some(
          (subItem) => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
        );
      })
      .map((item) => item.href);

    if (activeParents.length === 0) return;
    setOpenDropdowns((prev) => Array.from(new Set([...prev, ...activeParents])));
  }, [pathname, visibleNavItems]);

  useEffect(() => {
    let mounted = true;
    const token = typeof window !== "undefined" ? (localStorage.getItem("authToken") ?? undefined) : undefined;

    const load = async () => {
      try {
        const [stats, activities, unreadNotifications] = await Promise.all([
          canSeeHome ? fetchAdminStats(token).catch(() => null) : Promise.resolve(null),
          canSeeHome ? fetchRecentActivities(20, token).catch(() => null) : Promise.resolve(null),
          canSeeNotifications ? fetchAdminNotificationsCount(token).catch(() => 0) : Promise.resolve(0),
        ]);

        const recentCount = typeof activities?.count === "number"
          ? activities.count
          : Array.isArray(activities?.activities)
            ? activities.activities.length
            : 0;
        const adsTotal = typeof stats?.cards?.total?.count === "number" ? stats.cards.total.count : 0;

        if (!mounted) return;
        setCounts({
          "/dashboard": recentCount,
          "/ads": adsTotal,
          "/notifications": Number(unreadNotifications) || 0,
        });
      } catch {
        if (mounted) setCounts({});
      }
    };

    load();

    if (!canSeeNotifications) return () => { mounted = false; };

    const pollNotifications = setInterval(async () => {
      try {
        const c = await fetchAdminNotificationsCount(token).catch(() => 0);
        setCounts(prev => ({ ...prev, "/notifications": Number(c) || 0 }));
      } catch { }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(pollNotifications);
    };
  }, [canSeeHome, canSeeNotifications]);

  const handleLogout = async () => {
    await logoutDashboard().catch(() => undefined);
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userRole');
    localStorage.removeItem('dashboardUser');
    router.push('/auth/login');
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay active" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="إغلاق القائمة الجانبية"
        >
          <span className="close-icon">×</span>
        </button>

        <div className="sidebar-header">
          <Image
            className="logo"
            src="/nas-masr.png"
            alt="شعار ناس مصر"
            width={140}
            height={140}
            priority
          />
          <div className="sidebar-title">لوحة التحكم</div>
        </div>

        <nav aria-label="القائمة الرئيسية">
          <ul className="nav-list">
            {visibleNavItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isSubItemActive = hasSubItems
                ? item.subItems!.some(
                  (subItem) => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                )
                : false;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href)) ||
                isSubItemActive;
              const isDropdownOpen = openDropdowns.includes(item.href);

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <button
                      className={`nav-item dropdown-toggle${isActive ? " active" : ""}`}
                      onClick={() => {
                        if (item.toggleOnly || pathname === item.href) {
                          toggleDropdown(item.href);
                          return;
                        }
                        router.push(item.href);
                        onClose?.();
                      }}
                      type="button"
                    >
                      <span className="nav-indicator" aria-hidden="true" />
                      <Image src={item.icon} alt="" width={20} height={20} className="nav-icon" />
                      <span className="nav-text">{item.label}</span>
                      {typeof counts[item.href] === "number" && counts[item.href] > 0 ? (
                        <span className="nav-count-badge">{counts[item.href]}</span>
                      ) : null}
                      <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                        ▼
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`nav-item${isActive ? " active" : ""}`}
                      onClick={onClose}
                    >
                      <span className="nav-indicator" aria-hidden="true" />
                      <Image src={item.icon} alt="" width={20} height={20} className="nav-icon" />
                      <span className="nav-text">{item.label}</span>
                      {typeof counts[item.href] === "number" && counts[item.href] > 0 ? (
                        <span className="nav-count-badge">{counts[item.href]}</span>
                      ) : null}
                    </Link>
                  )}

                  {hasSubItems && (
                    <ul className={`nav-sub-list ${isDropdownOpen ? 'open' : ''}`}>
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                        return (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              className={`nav-sub-item${isSubActive ? " active" : ""}`}
                              onClick={onClose}
                            >
                              <span className="nav-sub-indicator" aria-hidden="true" />
                              <Image src={subItem.icon} alt="" width={16} height={16} className="nav-sub-icon" />
                              <span className="nav-sub-text">{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} type="button">
            <svg className="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="logout-text">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
