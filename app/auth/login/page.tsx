'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login as loginService, AuthResponse, AuthError } from '@/services/auth';
import { storeDashboardUser } from '@/utils/dashboardSession';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralErrors([]);
    setEmailErrors([]);
    setPasswordErrors([]);
    setIsLoading(true);

    const validationErrors: { email?: string; password?: string } = {};
    if (!identifier) validationErrors.email = 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف';
    if (!password) validationErrors.password = 'يرجى إدخال كلمة المرور';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const looksLikePhone = /^[+\d\s-]{6,}$/.test(identifier);
    if (identifier && !looksLikePhone && !emailPattern.test(identifier)) {
      validationErrors.email = 'صيغة البريد الإلكتروني أو رقم الهاتف غير صحيحة';
    }
    if (password && password.length < 6) {
      validationErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (validationErrors.email || validationErrors.password) {
      if (validationErrors.email) setEmailErrors([validationErrors.email]);
      if (validationErrors.password) setPasswordErrors([validationErrors.password]);
      setIsLoading(false);
      return;
    }

    

    try {
      const data: AuthResponse = await loginService(identifier, password);
      const tokenVal = typeof data.token === 'string' ? data.token : typeof data.access_token === 'string' ? data.access_token : null;
      const user = data.user;
      if (!user || typeof user.role !== 'string') {
        setGeneralErrors(['الاستجابة غير متوقعة من الخادم']);
        setIsLoading(false);
        return;
      }
      if (!['admin', 'employee'].includes(user.role.toLowerCase())) {
        setGeneralErrors(['غير مسموح بدخول هذا الحساب إلى لوحة الإدارة']);
        setIsLoading(false);
        return;
      }
      if (tokenVal) {
        localStorage.setItem('authToken', tokenVal);
      }
      localStorage.setItem('isAuthenticated', 'true');
      if ((user as any).email) {
        localStorage.setItem('userEmail', (user as any).email);
      } else if (user.phone) {
        localStorage.setItem('userPhone', user.phone);
      }
      localStorage.setItem('userRole', user.role);
      storeDashboardUser(user);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        const fe = error.fieldErrors;
        const gen: string[] = [];
        if (error.message) gen.push(error.message);
        if (fe) {
          const p = fe['email'];
          const pw = fe['password'];
          if (Array.isArray(p)) setEmailErrors(p);
          else if (typeof p === 'string') setEmailErrors([p]);
          if (Array.isArray(pw)) setPasswordErrors(pw);
          else if (typeof pw === 'string') setPasswordErrors([pw]);
        }
        setGeneralErrors(gen);
      } else {
        const message = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى';
        setGeneralErrors([message]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-login-container">
      {/* Background Elements */}
      <div className="background-wrapper">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="mesh-gradient"></div>
      </div>

      {/* Main Content */}
      <div className="login-wrapper">
        <div className="login-card-modern">
          {/* Header Section */}
          <div className="login-header-modern">
            <div className="logo-wrapper">
              <div className="logo-glow">
                <Image
                  src="/nas-masr.png"
                  alt="ناس مصر"
                  width={135}
                  height={85}
                  className="logo-modern"
                  priority
                />
              </div>
            </div>
            <h1 className="welcome-title" style={{ color: '#6b6767ff' , fontSize: '34px' ,marginBottom: '0px' }}>أهلاً وسهلاً</h1>
            <p className="welcome-subtitle" style={{ color: '#6b6767ff' , fontSize: '16px' , marginBottom: '20px' }}>ادخل إلى عالم ناس مصر الرقمي</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="modern-form">
            {generalErrors.length > 0 && (
              <div className="error-alert">
                <div className="error-icon-wrapper">
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <ul className="error-list">
                  {generalErrors.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="input-group">
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="modern-input"
                  placeholder=" "
                  required
                />
                <label className="floating-label">البريد الإلكتروني أو رقم الهاتف</label>
                {emailErrors.length > 0 && (
                  <ul className="error-list field-errors">
                    {emailErrors.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="modern-input"
                  placeholder=" "
                  required
                />
                <label className="floating-label">كلمة المرور</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-modern"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 4.231 7.81663 6.62 6.62M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5717 9.14351 13.1984C8.99262 12.8251 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
                {passwordErrors.length > 0 && (
                  <ul className="error-list field-errors">
                    {passwordErrors.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="form-options-modern">
              <label className="modern-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">تذكرني</span>
              </label>
    
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="modern-submit-btn"
            >
              <span className="btn-content">
                {isLoading ? (
                  <>
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15M10 17L15 12L10 7M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    تسجيل الدخول
                  </>
                )}
              </span>
              <div className="btn-shine"></div>
            </button>
          </form>

        
        </div>
      </div>
    </div>
  );
}
