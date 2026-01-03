'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchAdminStats, fetchRecentActivities } from "@/services/adminStats";
import { fetchUsersSummary } from "@/services/users";
import { fetchAdminNotificationsCount } from "@/services/notifications";

type NavSubItem = { href: string; label: string; icon: string };
type NavItem = { href: string; label: string; icon: string; subItems?: NavSubItem[] };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "/window.svg" },

  {
    href: "/ads",
    label: "إدارة الإعلانات",
    icon: "/file.svg",
    subItems: [
      { href: "/ads/create", label: "إنشاء إعلان", icon: "/file.svg" },
      { href: "/ads/rules", label: "إدارة الباقات", icon: "/globe.svg" },
      { href: "/moderation", label: "الموافقات والمراجعة", icon: "/star.png" },
      { href: "/moderation/unpaid", label: "مراجعة الإعلانات غير المدفوعة", icon: "/star.png" },
    ]
  },
  {
    href: "/categories",
    label: "الأقسام والتصنيفات",
    icon: "/categories.png",
    subItems: [
      { href: "/category-homepage-management", label: "إدارة أقسام الصفحة الرئيسية", icon: "/categories.png" }
    ]
  },

  { href: "/users", label: " المستخدمون والمعلِنون والمناديب ", icon: "/profile.png" },
  { href: "/reports", label: "التقارير والإحصائيات", icon: "/clipboard.png" },
  { href: "/notifications", label: "الإشعارات ", icon: "/bell.png" },
  { href: "/messages", label: "الرسائل", icon: "/chat2.png" },
  { href: "/customer-chats", label: " محادثات العملاء ", icon: "/chat3.png" },
  { href: "/settings", label: "الضبط العام", icon: "/cogwheel.png" }
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

  const toggleDropdown = (href: string) => {
    setOpenDropdowns(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  useEffect(() => {
    let mounted = true;
    const token = typeof window !== "undefined" ? (localStorage.getItem("authToken") ?? undefined) : undefined;
    const load = async () => {
      try {
        const [stats, activities, users, unreadNotifications] = await Promise.all([
          fetchAdminStats(token).catch(() => null),
          fetchRecentActivities(20, token).catch(() => null),
          fetchUsersSummary(token).catch(() => null),
          fetchAdminNotificationsCount(token).catch(() => 0),
        ]);
        const advCount = Array.isArray(users?.users) ? users!.users.filter(u => u.role === "advertiser").length : 0;
        const userCount = Array.isArray(users?.users) ? users!.users.filter(u => u.role === "user").length : 0;
        const msgCount = Array.isArray(users?.users) ? users!.users.length * 2 : 0;
        const chatsCount = Math.max(advCount, userCount);
        const adsTotal = typeof stats?.cards?.total?.count === "number" ? stats!.cards.total.count : 0;
        const recentCount = typeof activities?.count === "number" ? activities!.count : Array.isArray(activities?.activities) ? activities!.activities.length : 0;
        const next: Record<string, number> = {
          "/dashboard": recentCount,
          "/ads": adsTotal,
          "/notifications": Number(unreadNotifications) || 0,
          "/messages": msgCount,
          "/customer-chats": chatsCount,
        };
        if (!mounted) return;
        setCounts(next);
      } catch { }
    };
    load();
    const pollNotifications = setInterval(async () => {
      try {
        const c = await fetchAdminNotificationsCount(token).catch(() => 0);
        setCounts(prev => ({ ...prev, "/notifications": Number(c) || 0 }));
      } catch { }
    }, 60000);
    return () => { mounted = false; clearInterval(pollNotifications); };
  }, []);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay active" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
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
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isDropdownOpen = openDropdowns.includes(item.href);

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <button
                      className={`nav-item dropdown-toggle${isActive ? " active" : ""}`}
                      onClick={() => { router.push(item.href); toggleDropdown(item.href); }}
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

                  {/* Sub-items */}
                  {hasSubItems && (
                    <ul className={`nav-sub-list ${isDropdownOpen ? 'open' : ''}`}>
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
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

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('rememberMe');
              router.push('/auth/login');
            }}
            type="button"
          >
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
