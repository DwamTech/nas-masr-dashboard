'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { logoutDashboard } from "@/services/auth";
import { readDashboardUser } from "@/utils/dashboardSession";
import { resolveBackendAssetUrl } from "@/utils/api";
import styles from "./Header.module.css";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('المستخدم');
  const [userRole, setUserRole] = useState('موظف');
  const [userImage, setUserImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncUser = () => {
      const user = readDashboardUser();
      if (!user) return;
      setUserName(user.name || 'المستخدم');
      setUserRole(String(user.role || '').toLowerCase() === 'admin' ? 'مدير النظام' : 'موظف');
      setUserImage(resolveBackendAssetUrl(user.profile_image_url) || null);
    };

    syncUser();
    window.addEventListener('dashboard-user-updated', syncUser);
    return () => window.removeEventListener('dashboard-user-updated', syncUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const avatarSrc = useMemo(() => resolveBackendAssetUrl(userImage) || '/user.png', [userImage]);
  const avatarFallback = useMemo(() => userName.trim().charAt(0).toUpperCase() || 'U', [userName]);

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
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          className={styles.menuButton}
          onClick={onToggleSidebar}
          aria-label="فتح أو إغلاق القائمة الجانبية"
          type="button"
        >
          <Menu size={20} />
        </button>

        <div className={styles.titleWrap}>
          <span className={styles.kicker}>لوحة التحكم</span>
          <h1 className={styles.title}>ناس مصر</h1>
        </div>
      </div>

      <div className={styles.profileMenu} ref={menuRef}>
        <button
          type="button"
          className={`${styles.profileCard} ${menuOpen ? styles.profileCardOpen : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <div className={styles.avatarWrap}>
            <div className={styles.avatarRing}>
              {userImage ? (
                <img
                  src={avatarSrc}
                  alt="صورة المستخدم"
                  className={styles.avatarImage}
                  width={48}
                  height={48}
                />
              ) : (
                <span className={styles.avatarFallback}>{avatarFallback}</span>
              )}
            </div>
            <span className={styles.statusDot} aria-hidden="true" />
          </div>

          <div className={styles.profileText}>
            <span className={styles.profileName}>{userName}</span>
            <span className={styles.roleBadge}>
              <ShieldCheck size={14} />
              {userRole}
            </span>
          </div>

          <span className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </button>

        {menuOpen && (
          <div className={styles.dropdown} role="menu">
            <div className={styles.dropdownHeader}>
              <div className={styles.dropdownAvatar}>
                {userImage ? (
                  <img
                    src={avatarSrc}
                    alt="صورة المستخدم"
                    className={styles.dropdownAvatarImage}
                    width={42}
                    height={42}
                  />
                ) : (
                  <span className={styles.dropdownAvatarFallback}>{avatarFallback}</span>
                )}
              </div>
              <div className={styles.dropdownIdentity}>
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>
            </div>

            <div className={styles.dropdownList}>
              <Link
                href="/dashboard"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard size={17} />
                <span>لوحة التحكم</span>
              </Link>

              <Link
                href="/admin-account"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
              >
                <UserCircle2 size={17} />
                <span>إدارة الحساب الشخصي</span>
              </Link>

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
