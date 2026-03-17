'use client';

import { useEffect, useMemo, useState } from 'react';
import { changeAdminPassword, fetchDashboardAccount, updateDashboardProfile, AdminAccountError } from '@/services/adminAccount';
import { storeDashboardUser } from '@/utils/dashboardSession';
import { resolveBackendAssetUrl } from '@/utils/api';

type FieldKey = 'current_password' | 'new_password' | 'new_password_confirmation';

export default function AdminAccountPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<FieldKey, string[]>>({
    current_password: [],
    new_password: [],
    new_password_confirmation: [],
  });

  useEffect(() => {
    fetchDashboardAccount()
      .then((result) => {
        const user = result.user;
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setImageUrl(resolveBackendAssetUrl(user.profile_image_url) || null);
        storeDashboardUser(user);
      })
      .catch((error) => {
        setProfileError(error instanceof Error ? error.message : 'تعذر تحميل الحساب الشخصي');
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const hasAnyError = useMemo(
    () =>
      Boolean(generalError) ||
      fieldErrors.current_password.length > 0 ||
      fieldErrors.new_password.length > 0 ||
      fieldErrors.new_password_confirmation.length > 0,
    [generalError, fieldErrors]
  );

  const clearErrors = () => {
    setGeneralError(null);
    setFieldErrors({
      current_password: [],
      new_password: [],
      new_password_confirmation: [],
    });
  };

  const validateClient = () => {
    const nextErrors: Record<FieldKey, string[]> = {
      current_password: [],
      new_password: [],
      new_password_confirmation: [],
    };

    if (!currentPassword.trim()) {
      nextErrors.current_password.push('يرجى إدخال كلمة المرور الحالية');
    }

    if (!newPassword.trim()) {
      nextErrors.new_password.push('يرجى إدخال كلمة المرور الجديدة');
    } else if (newPassword.length < 6) {
      nextErrors.new_password.push('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
    }

    if (!confirmPassword.trim()) {
      nextErrors.new_password_confirmation.push('يرجى تأكيد كلمة المرور الجديدة');
    } else if (confirmPassword !== newPassword) {
      nextErrors.new_password_confirmation.push('تأكيد كلمة المرور غير مطابق');
    }

    setFieldErrors(nextErrors);

    return (
      nextErrors.current_password.length === 0 &&
      nextErrors.new_password.length === 0 &&
      nextErrors.new_password_confirmation.length === 0
    );
  };

  const submitProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setSavingProfile(true);

    try {
      const result = await updateDashboardProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        profileImageFile: imageFile,
        removeProfileImage: removeImage,
      });

      storeDashboardUser(result.user);
      setImageUrl(resolveBackendAssetUrl(result.user.profile_image_url) || null);
      setImageFile(null);
      setRemoveImage(false);
      setProfileMessage(result.message || 'تم تحديث الحساب الشخصي بنجاح');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'تعذر تحديث الحساب الشخصي');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage(null);
    clearErrors();

    if (!validateClient()) return;

    setLoadingPassword(true);
    try {
      const result = await changeAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setSuccessMessage(result.message || 'تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof AdminAccountError) {
        setGeneralError(error.message || 'تعذر تغيير كلمة المرور');
        const next: Record<FieldKey, string[]> = {
          current_password: [],
          new_password: [],
          new_password_confirmation: [],
        };
        const backendErrors = error.fieldErrors || {};

        (Object.keys(next) as FieldKey[]).forEach((key) => {
          const item = backendErrors[key];
          if (Array.isArray(item)) next[key] = item;
          else if (typeof item === 'string' && item.trim()) next[key] = [item];
        });

        setFieldErrors(next);
      } else {
        setGeneralError('حدث خطأ غير متوقع أثناء تغيير كلمة المرور');
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  const previewSrc = imageFile
    ? URL.createObjectURL(imageFile)
    : (removeImage ? '/user.png' : (resolveBackendAssetUrl(imageUrl) || '/user.png'));

  return (
    <div className="admin-account-page">
      <div className="admin-account-header">
        <h1>إدارة الحساب الشخصي</h1>
        <p>يمكنك تحديث بياناتك وصورتك الشخصية وتغيير كلمة المرور من نفس الصفحة.</p>
      </div>

      <div className="account-grid">
        <form className="admin-account-card" onSubmit={submitProfile}>
          <h2>البيانات الشخصية</h2>
          {profileMessage && <div className="alert success">{profileMessage}</div>}
          {profileError && <div className="alert error">{profileError}</div>}

          <div className="profile-preview">
            <img src={previewSrc} alt="الصورة الشخصية" width={96} height={96} className="profile-image" />
          </div>

          <div className="field-group">
            <label htmlFor="profileImage">الصورة الشخصية</label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) setRemoveImage(false);
              }}
              disabled={savingProfile || loadingProfile}
            />
            {imageUrl && (
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                  disabled={savingProfile || loadingProfile}
                />
                حذف الصورة الحالية
              </label>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="name">الاسم</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={savingProfile || loadingProfile} />
          </div>

          <div className="field-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={savingProfile || loadingProfile} />
          </div>

          <div className="field-group">
            <label htmlFor="phone">رقم الهاتف</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={savingProfile || loadingProfile} />
          </div>

          <div className="actions">
            <button type="submit" disabled={savingProfile || loadingProfile}>
              {savingProfile ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>
        </form>

        <form className="admin-account-card" onSubmit={submitPassword}>
          <h2>تغيير كلمة المرور</h2>
          {successMessage && <div className="alert success">{successMessage}</div>}
          {hasAnyError && generalError && <div className="alert error">{generalError}</div>}

          <div className="field-group">
            <label htmlFor="currentPassword">كلمة المرور الحالية</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loadingPassword}
            />
            {fieldErrors.current_password.map((msg, idx) => <p key={`cp-${idx}`} className="field-error">{msg}</p>)}
          </div>

          <div className="field-group">
            <label htmlFor="newPassword">كلمة المرور الجديدة</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loadingPassword}
            />
            {fieldErrors.new_password.map((msg, idx) => <p key={`np-${idx}`} className="field-error">{msg}</p>)}
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loadingPassword}
            />
            {fieldErrors.new_password_confirmation.map((msg, idx) => <p key={`npc-${idx}`} className="field-error">{msg}</p>)}
          </div>

          <div className="actions">
            <button type="submit" disabled={loadingPassword}>
              {loadingPassword ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .admin-account-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
          direction: rtl;
        }
        .admin-account-header { margin-bottom: 20px; }
        .admin-account-header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; }
        .admin-account-header p { margin: 8px 0 0; color: #64748b; font-size: 14px; }
        .account-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
        .admin-account-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; box-shadow: 0 10px 25px rgba(2, 8, 23, 0.06); }
        .admin-account-card h2 { margin: 0 0 16px; font-size: 20px; color: #0f172a; }
        .profile-preview { display: flex; justify-content: center; margin-bottom: 16px; }
        .profile-image { border-radius: 999px; object-fit: cover; border: 4px solid #e2e8f0; }
        .alert { border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; font-size: 14px; font-weight: 600; }
        .alert.success { background: #ecfdf5; border: 1px solid #86efac; color: #166534; }
        .alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .field-group { display: flex; flex-direction: column; margin-bottom: 14px; }
        .field-group label { font-size: 14px; margin-bottom: 8px; color: #334155; font-weight: 700; }
        .field-group input { border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 12px; font-size: 15px; outline: none; }
        .field-group input:disabled { background: #f8fafc; color: #94a3b8; }
        .checkbox-line { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; color: #475569; }
        .field-error { margin: 6px 0 0; color: #b91c1c; font-size: 12px; font-weight: 600; }
        .actions { margin-top: 8px; display: flex; justify-content: flex-end; }
        .actions button { border: 0; border-radius: 10px; background: #0f766e; color: #fff; padding: 10px 16px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .actions button:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .admin-account-page { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
