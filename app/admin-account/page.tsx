'use client';

import { useMemo, useState } from 'react';
import { changeAdminPassword, AdminAccountError } from '@/services/adminAccount';

type FieldKey = 'current_password' | 'new_password' | 'new_password_confirmation';

export default function AdminAccountPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<FieldKey, string[]>>({
    current_password: [],
    new_password: [],
    new_password_confirmation: [],
  });

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

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage(null);
    clearErrors();

    if (!validateClient()) return;

    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="admin-account-page">
      <div className="admin-account-header">
        <h1>إدارة حساب الأدمن</h1>
        <p>يمكنك تغيير كلمة المرور من خلال إدخال كلمة المرور الحالية ثم الجديدة.</p>
      </div>

      <form className="admin-account-card" onSubmit={submit}>
        {successMessage && <div className="alert success">{successMessage}</div>}
        {hasAnyError && generalError && <div className="alert error">{generalError}</div>}

        <div className="field-group">
          <label htmlFor="currentPassword">كلمة المرور الحالية</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="اكتب كلمة المرور الحالية"
            autoComplete="current-password"
            disabled={loading}
          />
          {fieldErrors.current_password.map((msg, idx) => (
            <p key={`cp-${idx}`} className="field-error">
              {msg}
            </p>
          ))}
        </div>

        <div className="field-group">
          <label htmlFor="newPassword">كلمة المرور الجديدة</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="اكتب كلمة المرور الجديدة"
            autoComplete="new-password"
            disabled={loading}
          />
          {fieldErrors.new_password.map((msg, idx) => (
            <p key={`np-${idx}`} className="field-error">
              {msg}
            </p>
          ))}
        </div>

        <div className="field-group">
          <label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد كتابة كلمة المرور الجديدة"
            autoComplete="new-password"
            disabled={loading}
          />
          {fieldErrors.new_password_confirmation.map((msg, idx) => (
            <p key={`npc-${idx}`} className="field-error">
              {msg}
            </p>
          ))}
        </div>

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .admin-account-page {
          max-width: 760px;
          margin: 0 auto;
          padding: 24px;
          direction: rtl;
        }

        .admin-account-header {
          margin-bottom: 20px;
        }

        .admin-account-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
        }

        .admin-account-header p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .admin-account-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 10px 25px rgba(2, 8, 23, 0.06);
        }

        .alert {
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 14px;
          font-size: 14px;
          font-weight: 600;
        }

        .alert.success {
          background: #ecfdf5;
          border: 1px solid #86efac;
          color: #166534;
        }

        .alert.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 14px;
        }

        .field-group label {
          font-size: 14px;
          margin-bottom: 8px;
          color: #334155;
          font-weight: 700;
        }

        .field-group input {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 11px 12px;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .field-group input:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }

        .field-group input:disabled {
          background: #f8fafc;
          color: #94a3b8;
        }

        .field-error {
          margin: 6px 0 0;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 600;
        }

        .actions {
          margin-top: 8px;
          display: flex;
          justify-content: flex-end;
        }

        .actions button {
          border: 0;
          border-radius: 10px;
          background: #0f766e;
          color: #fff;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .admin-account-page {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
}

