'use client';
import React, { useState, useEffect } from 'react';
import { fetchSystemSettings, updateSystemSettings } from '@/services/systemSettings';
import LegalDocumentEditor from '@/components/settings/LegalDocumentEditor';
import { parseLegalDocument, serializeLegalDocument, stampLegalDocument } from '@/utils/legalDocument';
import type { SystemSettingsPayload } from '@/models/system-settings';
const LS_KEY = 'systemSettingsDraft';

type SettingsTabId = 'general' | 'interface' | 'terms' | 'privacy';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[];
  duration?: number; // milliseconds; if 0 or actions provided, stays until closed
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [savingTab, setSavingTab] = useState<SettingsTabId | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    options?: { actions?: Toast['actions']; duration?: number }
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message,
      type,
      actions: options?.actions,
      duration: options?.duration,
    };
    setToasts(prev => [...prev, newToast]);

    const autoDuration = options?.duration ?? 4000;
    if (!newToast.actions && autoDuration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, autoDuration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const [settings, setSettings] = useState({
    // General Settings
    privacyPolicy: '',
    termsOfService: '',
    contactLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      whatsapp: '',
      email: '',
      phone: ''
    },
    supportNumbers: {
      support: '',
      passwordChange: '',
      instapay: '',
      vodafoneCash: '',
      paymentInquiries: '',
      inquiries: ''
    },

    // Interface Settings
    showPhoneNumbers: false,
    advertisersCount: 0,
    adsPerSection: 8,
    sectionsOrder: ['featured', 'recent', 'popular'],
    sideBanners: true,

    // Security Settings
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    pinSettings: {
      numericOnly: true,
      length: 6
    },
    twoFactorAuth: false,
    sessionDuration: 24, // hours

    // Communications Settings
    smsProvider: 'default',
    emailProvider: 'default',
    pushNotifications: true,

    // Integrations Settings
    apiKeys: {
      sms: '',
      email: '',
      push: '',
      analytics: ''
    },
    webhooks: {
      userRegistration: '',
      adApproval: '',
      paymentSuccess: ''
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') setSettings(draft);
      }
    } catch { }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const resp = await fetchSystemSettings();
        // Handle response structure where data might be root or in .data
        const d: any = (resp as any).data || resp;
        if (!d) return;

        setSettings((prev) => ({
          ...prev,
          privacyPolicy: d.privacy_policy || '',
          termsOfService: d['terms_conditions-main_'] || '',
          contactLinks: {
            facebook: prev?.contactLinks?.facebook || d.facebook || '',
            twitter: prev?.contactLinks?.twitter || d.twitter || '',
            instagram: prev?.contactLinks?.instagram || d.instagram || '',
            whatsapp: prev?.contactLinks?.whatsapp || '',
            email: prev?.contactLinks?.email || d.email || '',
            phone: prev?.contactLinks?.phone || '',
          },
          supportNumbers: {
            support: prev?.supportNumbers?.support || d.support_number || '',
            passwordChange: prev?.supportNumbers?.passwordChange || d.sub_support_number || '',
            instapay: prev?.supportNumbers?.instapay || d.instapay_number || '',
            vodafoneCash: prev?.supportNumbers?.vodafoneCash || d.vodafone_cash_number || '',
            paymentInquiries:
              prev?.supportNumbers?.paymentInquiries || d.payment_inquiries_number || '',
            inquiries: prev?.supportNumbers?.inquiries || d.emergency_number || '',
          },
          showPhoneNumbers: typeof prev?.showPhoneNumbers === 'boolean' ? prev.showPhoneNumbers : Boolean(d.show_phone),
          advertisersCount: typeof prev?.advertisersCount === 'number' && prev.advertisersCount !== 0
            ? prev.advertisersCount
            : (typeof d.featured_users_count === 'number' ? d.featured_users_count : (prev?.advertisersCount || 0)),
          adsPerSection: prev?.adsPerSection || 8,
          sectionsOrder: prev?.sectionsOrder || ['featured', 'recent', 'popular'],
          sideBanners: typeof prev?.sideBanners === 'boolean' ? prev.sideBanners : true,
          passwordRequirements: prev?.passwordRequirements || { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true },
          pinSettings: prev?.pinSettings || { numericOnly: true, length: 6 },
          twoFactorAuth: prev?.twoFactorAuth || false,
          sessionDuration: prev?.sessionDuration || 24,
          smsProvider: prev?.smsProvider || 'default',
          emailProvider: prev?.emailProvider || 'default',
          pushNotifications: typeof prev?.pushNotifications === 'boolean' ? prev.pushNotifications : true,
          apiKeys: prev?.apiKeys || { sms: '', email: '', push: '', analytics: '' },
          webhooks: prev?.webhooks || { userRegistration: '', adApproval: '', paymentSuccess: '' },
        }));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch { }
  }, [settings]);

  const handleInputChange = (section: string, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as Record<string, string | number | boolean>),
        [field]: value
      }
    }));
  };

  const handleSave = async (tab: SettingsTabId) => {
    let payload: SystemSettingsPayload = {};
    let successMessage = 'تم حفظ الإعدادات بنجاح!';

    if (tab === 'general') {
      payload = {
        support_number: settings.supportNumbers.support,
        sub_support_number: settings.supportNumbers.passwordChange,
        instapay_number: settings.supportNumbers.instapay,
        vodafone_cash_number: settings.supportNumbers.vodafoneCash,
        payment_inquiries_number: settings.supportNumbers.paymentInquiries,
        emergency_number: settings.supportNumbers.inquiries,
        facebook: settings.contactLinks.facebook,
        twitter: settings.contactLinks.twitter,
        instagram: settings.contactLinks.instagram,
        email: settings.contactLinks.email,
      };
      successMessage = 'تم حفظ الإعدادات العامة بنجاح!';
    }

    if (tab === 'interface') {
      payload = {
        show_phone: settings.showPhoneNumbers,
        featured_users_count: settings.advertisersCount,
      };
      successMessage = 'تم حفظ إعدادات الواجهة بنجاح!';
    }

    if (tab === 'terms' || tab === 'privacy') {
      const fieldName = tab === 'terms' ? 'termsOfService' : 'privacyPolicy';
      const stampedDocument = serializeLegalDocument(
        stampLegalDocument(parseLegalDocument(settings[fieldName]))
      );

      setSettings((prev) => ({
        ...prev,
        [fieldName]: stampedDocument,
      }));

      payload =
        tab === 'terms'
          ? { 'terms_conditions-main_': stampedDocument }
          : { privacy_policy: stampedDocument };
      successMessage = tab === 'terms' ? 'تم حفظ الشروط والأحكام بنجاح!' : 'تم حفظ سياسة الخصوصية بنجاح!';
    }

    setSavingTab(tab);
    try {
      const resp = await updateSystemSettings(payload);
      if (resp?.status === 'ok') {
        showToast(successMessage, 'success');
      } else {
        showToast('تعذر حفظ الإعدادات', 'error');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSavingTab(null);
    }
  };

  const tabs: { id: SettingsTabId; label: string }[] = [
    { id: 'general', label: 'عام' },
    { id: 'interface', label: 'واجهة' },
    { id: 'terms', label: 'الشروط والأحكام' },
    { id: 'privacy', label: 'سياسة الخصوصية' },
  ];

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">الإعدادات العامة</h3>

      <div className="settings-group">
        <h4 className="group-title">روابط التواصل الاجتماعي</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="facebook">فيسبوك</label>
            <input
              type="url"
              id="facebook"
              className="form-input"
              value={settings.contactLinks.facebook}
              onChange={(e) => handleInputChange('contactLinks', 'facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="twitter">تويتر</label>
            <input
              type="url"
              id="twitter"
              className="form-input"
              value={settings.contactLinks.twitter}
              onChange={(e) => handleInputChange('contactLinks', 'twitter', e.target.value)}
              placeholder="https://twitter.com/..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="instagram">إنستغرام</label>
            <input
              type="url"
              id="instagram"
              className="form-input"
              value={settings.contactLinks.instagram}
              onChange={(e) => handleInputChange('contactLinks', 'instagram', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          {/* <div className="form-group">
            <label htmlFor="whatsapp">واتساب</label>
            <input
              type="tel"
              id="whatsapp"
              className="form-input"
              value={settings.contactLinks.whatsapp}
              onChange={(e) => handleInputChange('contactLinks', 'whatsapp', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div> */}
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={settings.contactLinks.email}
              onChange={(e) => handleInputChange('contactLinks', 'email', e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
          {/* <div className="form-group">
            <label htmlFor="phone">الهاتف</label>
            <input
              type="tel"
              id="phone"
              className="form-input"
              value={settings.contactLinks.phone}
              onChange={(e) => handleInputChange('contactLinks', 'phone', e.target.value)}
              placeholder="+20 2 XXXX XXXX"
            />
          </div> */}
        </div>
      </div>

      <div className="settings-group">
        <h4 className="group-title">أرقام الدعم</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="supportNumber">رقم الدعم (support_number)</label>
            <input
              type="tel"
              id="supportNumber"
              className="form-input"
              value={settings.supportNumbers.support}
              onChange={(e) => handleInputChange('supportNumbers', 'support', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="passwordChangeNumber">رقم تغيير الباسورد (sub_support_number)</label>
            <input
              type="tel"
              id="passwordChangeNumber"
              className="form-input"
              value={settings.supportNumbers.passwordChange}
              onChange={(e) => handleInputChange('supportNumbers', 'passwordChange', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="instapayNumber">رقم إنستا باي (instapay_number)</label>
            <input
              type="tel"
              id="instapayNumber"
              className="form-input"
              value={settings.supportNumbers.instapay}
              onChange={(e) => handleInputChange('supportNumbers', 'instapay', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="vodafoneCashNumber">رقم فودافون كاش (vodafone_cash_number)</label>
            <input
              type="tel"
              id="vodafoneCashNumber"
              className="form-input"
              value={settings.supportNumbers.vodafoneCash}
              onChange={(e) => handleInputChange('supportNumbers', 'vodafoneCash', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="paymentInquiriesNumber">رقم استفسارات الدفع (payment_inquiries_number)</label>
            <input
              type="tel"
              id="paymentInquiriesNumber"
              className="form-input"
              value={settings.supportNumbers.paymentInquiries}
              onChange={(e) => handleInputChange('supportNumbers', 'paymentInquiries', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="inquiriesNumber">رقم الاستفسارات (emergency_number)</label>
            <input
              type="tel"
              id="inquiriesNumber"
              className="form-input"
              value={settings.supportNumbers.inquiries}
              onChange={(e) => handleInputChange('supportNumbers', 'inquiries', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterfaceSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">إعدادات الواجهة</h3>

      {/* <div className="settings-group">
        <h4 className="group-title">عرض أرقام الهواتف</h4>
        <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">
              {settings.showPhoneNumbers ? 'إظهار أرقام الهواتف علنًا' : 'إخفاء أرقام الهواتف (عرض كود المستخدم فقط)'}
            </span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.showPhoneNumbers}
                onChange={(e) => setSettings(prev => ({ ...prev, showPhoneNumbers: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.showPhoneNumbers ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
          <p className="form-help">
            عند التعطيل، سيتم عرض كود المستخدم مع زر "ابدأ محادثة" بدلاً من رقم الهاتف
          </p>
        </div>
      </div> */}

      <div className="settings-group">
        <h4 className="group-title">إعدادات الصفحة الرئيسية</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="advertisersCount">عدد المعلنين المفضلين</label>
            <input
              type="number"
              id="advertisersCount"
              className="form-input"
              min="1"
              max="50"
              value={settings.advertisersCount}
              onChange={(e) => setSettings(prev => ({ ...prev, advertisersCount: parseInt(e.target.value) }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="adsPerSection">عدد الإعلانات لكل قسم</label>
            <input
              type="number"
              id="adsPerSection"
              className="form-input"
              min="1"
              max="20"
              value={settings.adsPerSection}
              onChange={(e) => setSettings(prev => ({ ...prev, adsPerSection: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        {/* <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">تشغيل البانرات الجانبية</span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.sideBanners}
                onChange={(e) => setSettings(prev => ({ ...prev, sideBanners: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.sideBanners ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
        </div> */}
      </div>
    </div>
  );

  const renderTermsSettings = () => (
    <LegalDocumentEditor
      value={settings.termsOfService}
      onChange={(value) => setSettings((prev) => ({ ...prev, termsOfService: value }))}
      heading="الشروط والأحكام"
      description="أضف عناصر من نوع عنوان أو وصف، وسيتم عرضها مباشرة في صفحة الشروط داخل الويب والتطبيق."
    />
  );

  const renderPrivacySettings = () => (
    <LegalDocumentEditor
      value={settings.privacyPolicy}
      onChange={(value) => setSettings((prev) => ({ ...prev, privacyPolicy: value }))}
      heading="سياسة الخصوصية"
      description="نفس المحتوى هنا سيظهر في صفحة سياسة الخصوصية في الويب والتطبيق بدل النصوص الثابتة."
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'interface':
        return renderInterfaceSettings();
      case 'terms':
        return renderTermsSettings();
      case 'privacy':
        return renderPrivacySettings();
      default:
        return renderGeneralSettings();
    }
  };

  const saveButtonLabel =
    activeTab === 'general'
      ? 'حفظ الإعدادات العامة'
      : activeTab === 'interface'
        ? 'حفظ إعدادات الواجهة'
        : activeTab === 'terms'
          ? 'حفظ الشروط والأحكام'
          : 'حفظ سياسة الخصوصية';

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">الضبط العام</h1>
            <p className="page-description">إدارة إعدادات النظام والتكوينات العامة</p>
          </div>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {renderTabContent()}

          <div className="settings-actions">
            <button
              className="btn-save"
              onClick={() => handleSave(activeTab)}
              disabled={savingTab === activeTab}
              style={savingTab === activeTab ? { opacity: 0.7, cursor: 'wait' } : undefined}
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {savingTab === activeTab ? 'جارٍ الحفظ...' : saveButtonLabel}
            </button>
            {/* <button className="btn-reset" onClick={() => { try { localStorage.removeItem(LS_KEY); } catch {}; window.location.reload(); }}>
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة تعيين
            </button> */}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-header">
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}
              >
                ×
              </button>
            </div>
            {toast.actions && (
              <div className="toast-actions">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    className={`toast-action-btn toast-action-${action.variant || 'primary'}`}
                    onClick={() => {
                      action.onClick?.();
                      removeToast(toast.id);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
