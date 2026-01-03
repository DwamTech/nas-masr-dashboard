"use client";

import { useState, useEffect } from "react";
import { fetchCategoryPlanPrices, updateCategoryPlanPrices } from "../../../services/categoryPlans";
import { fetchSystemSettings, updateSystemSettings } from "../../../services/systemSettings";
import { CategoryPlanPrice, CategoryPlanPriceUpdateItem } from "../../../models/category-plans";

const initialRules = {
  free_ads_count: 0,
  free_ad_days_validity: 0,
  featured_days: 0,
  standard_days: 0,
};

export default function DisplayRules() {
  const [rules, setRules] = useState(initialRules);
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isEditingSection, setIsEditingSection] = useState(false);

  const [categoryRules, setCategoryRules] = useState<CategoryPlanPrice[]>([]);

  useEffect(() => {
    fetchSystemSettings()
      .then((res) => {
        const count = (res?.data?.free_ads_count ?? (res as unknown as { free_ads_count?: number }).free_ads_count ?? 0);
        const days = (res?.data?.free_ad_days_validity ?? (res as unknown as { free_ad_days_validity?: number }).free_ad_days_validity ?? 0);
        const featured = (res?.data?.featured_days ?? (res as unknown as { featured_days?: number }).featured_days ?? 0);
        const standard = (res?.data?.standard_days ?? (res as unknown as { standard_days?: number }).standard_days ?? 0);
        setRules({
          free_ads_count: Number(count) || 0,
          free_ad_days_validity: Number(days) || 0,
          featured_days: Number(featured) || 0,
          standard_days: Number(standard) || 0,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch system settings:", err);
      });

    fetchCategoryPlanPrices()
      .then((data) => {
        setCategoryRules(data);
      })
      .catch((err) => {
        console.error("Failed to fetch category plans:", err);
      });
  }, []);

  const handleSave = async () => {
    try {
      const items: CategoryPlanPriceUpdateItem[] = categoryRules.map(rule => ({
        category_id: rule.category_id,
        price_featured: Number(rule.price_featured) || 0,
        featured_ad_price: Number(rule.featured_ad_price) || 0,
        featured_days: Number(rule.featured_days) || 0,
        price_standard: Number(rule.price_standard) || 0,
        standard_ad_price: Number(rule.standard_ad_price) || 0,
        standard_days: Number(rule.standard_days) || 0,
        free_ad_max_price: Number(rule.free_ad_max_price) || 0,
      }));

      await updateCategoryPlanPrices({ items });

      setIsEditing(false);
      setSavedMessage("تم حفظ أسعار الباقات بنجاح ✅");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update prices:", error);
      setSavedMessage("حدث خطأ أثناء الحفظ ❌");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  const handleReset = () => {
    setRules(initialRules);
    setIsEditing(false);
    fetchCategoryPlanPrices()
      .then((data) => {
        setCategoryRules(data);
      })
      .catch(console.error);
  };

  const handleSaveSection = async () => {
    try {
      await updateSystemSettings({
        free_ads_count: Number(rules.free_ads_count) || 0,
        free_ad_days_validity: Number(rules.free_ad_days_validity) || 0,
        featured_days: Number(rules.featured_days) || 0,
        standard_days: Number(rules.standard_days) || 0,
      });
      setSavedMessage("تم حفظ قواعد الأقسام بنجاح ✅");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update system settings:", error);
      setSavedMessage("حدث خطأ أثناء حفظ قواعد الأقسام ❌");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  return (
    <div className="rules-container">
      {/* New Enhanced Header */}
      <div className="display-rules-banner">
        <div className="banner-wrapper">
          <div className="banner-info-section">
            <div className="banner-icon-container">
              <div className="banner-gear-icon">⚙️</div>
            </div>
            <div className="banner-text-content">
              <h1>إدارة الباقات</h1>
              <p>إدارة وتخصيص قواعد عرض الإعلانات في النظام</p>
            </div>
          </div>

          <div className="banner-controls-section">
            {savedMessage && (
              <div className="success-notification">{savedMessage}</div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="rules-grid">
        {/* Package Prices */}
        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">$</div>
            <div>
              <h3 className="card-title">قواعد للأقسام</h3>
              <p className="card-description">تحديد عدد الإعلانات المجانية لكل قسم</p>
            </div>
            <div className="card-controls">
              <button
                onClick={() => {
                  if (isEditingSection) {
                    handleSaveSection();
                  }
                  setIsEditingSection(prev => !prev);
                }}
                className="rules-action-btn btn-edit-rules"
              >
                {isEditingSection ? 'إنهاء التعديل' : 'تعديل'}
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">⭐</span>
                  عدد الإعلانات المجانية (في الشهر)

                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.free_ads_count}
                    onChange={(e) => setRules({
                      ...rules,
                      free_ads_count: parseInt(e.target.value) || 0,
                    })}
                    disabled={!isEditingSection}
                    className={`form-input ${isEditingSection ? 'editable' : 'readonly'}`}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">📅</span>
                  عدد ايام صلاحية الإعلانات المجانية ( بالايام )
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.free_ad_days_validity}
                    onChange={(e) => setRules({
                      ...rules,
                      free_ad_days_validity: parseInt(e.target.value) || 0,
                    })}
                    disabled={!isEditingSection}
                    className={`form-input ${isEditingSection ? 'editable' : 'readonly'}`}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">🌟</span>
                  عدد ايام صلاحية الباقة المميزة
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.featured_days}
                    onChange={(e) => setRules({
                      ...rules,
                      featured_days: parseInt(e.target.value) || 0,
                    })}
                    disabled={!isEditingSection}
                    className={`form-input ${isEditingSection ? 'editable' : 'readonly'}`}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">📄</span>
                  عدد ايام صلاحية الباقة الاستاندر
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.standard_days}
                    onChange={(e) => setRules({
                      ...rules,
                      standard_days: parseInt(e.target.value) || 0,
                    })}
                    disabled={!isEditingSection}
                    className={`form-input ${isEditingSection ? 'editable' : 'readonly'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">📂</div>
            <div>
              <h3 className="card-title">سعر إعلان الباقه في كل قسم</h3>
              <p className="card-description">تحديد سعر إعلان الباقة لكل نوع
              </p>
            </div>
            <div className="card-controls">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="rules-action-btn btn-save-changes">
                    <span>💾</span>
                    حفظ التغييرات
                  </button>
                  <button onClick={handleReset} className="rules-action-btn btn-cancel-changes">
                    <span>❌</span>
                    إلغاء
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="rules-action-btn btn-edit-rules">
                  تعديل أسعار الباقات
                </button>
              )}
            </div>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="data-table category-rules-table">
                <thead>
                  <tr>
                    <th>القسم</th>
                    <th>الباقة المميزة</th>
                    <th>الباقة ستاندر</th>
                    <th>الباقه المجانيه</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRules.map((category, index) => (
                    <tr key={category.category_slug}>
                      <td><div className="category-name">{category.category_name}</div></td>
                      <td>
                        <div className="pricing-stack">
                          <div className="pricing-item">
                            <div className="pricing-label">سعر الباقة</div>
                            <input
                              type="number"
                              min={0}
                              value={category.price_featured}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                const updated = [...categoryRules];
                                updated[index] = { ...updated[index], price_featured: v };
                                setCategoryRules(updated);
                              }}
                              disabled={!isEditing}
                              className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                            />
                          </div>
                          <div className="pricing-bottom">
                            <div className="pricing-item">
                              <div className="pricing-label">سعر الإعلان</div>
                              <input
                                type="number"
                                min={0}
                                value={category.featured_ad_price}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  const updated = [...categoryRules];
                                  updated[index] = { ...updated[index], featured_ad_price: v };
                                  setCategoryRules(updated);
                                }}
                                disabled={!isEditing}
                                className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                              />
                            </div>
                            <div className="pricing-item">
                              <div className="pricing-label">أيام الصلاحية</div>
                              <input
                                type="number"
                                min={0}
                                value={category.featured_days}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  const updated = [...categoryRules];
                                  updated[index] = { ...updated[index], featured_days: v };
                                  setCategoryRules(updated);
                                }}
                                disabled={!isEditing}
                                className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pricing-stack">
                          <div className="pricing-item">
                            <div className="pricing-label">سعر الباقة</div>
                            <input
                              type="number"
                              min={0}
                              value={category.price_standard}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                const updated = [...categoryRules];
                                updated[index] = { ...updated[index], price_standard: v };
                                setCategoryRules(updated);
                              }}
                              disabled={!isEditing}
                              className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                            />
                          </div>
                          <div className="pricing-bottom">
                            <div className="pricing-item">
                              <div className="pricing-label">سعر الإعلان</div>
                              <input
                                type="number"
                                min={0}
                                value={category.standard_ad_price}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  const updated = [...categoryRules];
                                  updated[index] = { ...updated[index], standard_ad_price: v };
                                  setCategoryRules(updated);
                                }}
                                disabled={!isEditing}
                                className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                              />
                            </div>
                            <div className="pricing-item">
                              <div className="pricing-label">أيام الصلاحية</div>
                              <input
                                type="number"
                                min={0}
                                value={category.standard_days}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  const updated = [...categoryRules];
                                  updated[index] = { ...updated[index], standard_days: v };
                                  setCategoryRules(updated);
                                }}
                                disabled={!isEditing}
                                className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pricing-stack">
                          <div className="pricing-item">
                            <div className="pricing-label">أقصى سعر للإعلان المجاني</div>
                            <input
                              type="number"
                              min={0}
                              placeholder="0 = غير محدود"
                              value={category.free_ad_max_price ?? 0}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                const updated = [...categoryRules];
                                updated[index] = { ...updated[index], free_ad_max_price: v };
                                setCategoryRules(updated);
                              }}
                              disabled={!isEditing}
                              className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


    </div >
  );
}
