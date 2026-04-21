'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createEmptyLegalDocument,
  parseLegalDocument,
  serializeLegalDocument,
  toLegalSections,
  type LegalBlockType,
  type LegalDocumentData,
} from '@/utils/legalDocument';

interface LegalDocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
  heading: string;
  description: string;
}

function createBlock(type: LegalBlockType) {
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    content: '',
  };
}

export default function LegalDocumentEditor({
  value,
  onChange,
  heading,
  description,
}: LegalDocumentEditorProps) {
  const parsedValue = useMemo(() => parseLegalDocument(value), [value]);
  const [document, setDocument] = useState<LegalDocumentData>(parsedValue);

  useEffect(() => {
    setDocument(parsedValue);
  }, [parsedValue]);

  const pushChange = (next: LegalDocumentData) => {
    setDocument(next);
    onChange(serializeLegalDocument(next));
  };

  const updateBlock = (blockId: string, patch: Partial<LegalDocumentData['blocks'][number]>) => {
    pushChange({
      ...document,
      blocks: document.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    });
  };

  const addBlock = (type: LegalBlockType) => {
    pushChange({
      ...document,
      blocks: [...document.blocks, createBlock(type)],
    });
  };

  const removeBlock = (blockId: string) => {
    const nextBlocks = document.blocks.filter((block) => block.id !== blockId);
    pushChange({
      ...document,
      blocks: nextBlocks.length ? nextBlocks : createEmptyLegalDocument().blocks,
    });
  };

  const sections = toLegalSections(document);

  return (
    <div className="settings-section">
      <h3 className="section-title">{heading}</h3>

      <div className="settings-group">
        <h4 className="group-title">محرر النص</h4>
        <p className="form-help" style={{ marginBottom: '1rem' }}>
          {description}
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {document.blocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                border: '1px solid rgba(15, 23, 42, 0.08)',
                borderRadius: '18px',
                padding: '1rem',
                background: 'rgba(248, 250, 252, 0.65)',
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <strong style={{ color: '#0f172a' }}>عنصر {index + 1}</strong>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  style={{
                    border: 'none',
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#b91c1c',
                    borderRadius: '999px',
                    padding: '0.45rem 0.9rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  حذف
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor={`legal-block-type-${block.id}`}>نوع المحتوى</label>
                <select
                  id={`legal-block-type-${block.id}`}
                  className="form-select"
                  value={block.type}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      type: event.target.value as LegalBlockType,
                    })
                  }
                >
                  <option value="title">عنوان</option>
                  <option value="description">وصف</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor={`legal-block-content-${block.id}`}>
                  {block.type === 'title' ? 'نص العنوان' : 'نص الوصف'}
                </label>
                <textarea
                  id={`legal-block-content-${block.id}`}
                  className="form-textarea"
                  rows={block.type === 'title' ? 2 : 5}
                  value={block.content}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      content: event.target.value,
                    })
                  }
                  placeholder={
                    block.type === 'title'
                      ? 'مثال: جمع البيانات'
                      : 'اكتب الوصف الذي سيظهر أسفل العنوان في صفحات العرض'
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginTop: '1rem',
          }}
        >
          <button
            type="button"
            className="btn-save"
            onClick={() => addBlock('title')}
            style={{ width: 'auto', minWidth: 0, paddingInline: '1rem' }}
          >
            إضافة عنوان
          </button>
          <button
            type="button"
            className="btn-reset"
            onClick={() => addBlock('description')}
            style={{ width: 'auto', minWidth: 0, paddingInline: '1rem' }}
          >
            إضافة وصف
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h4 className="group-title">معاينة سريعة</h4>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {sections.length ? (
            sections.map((section) => (
              <article
                key={section.id}
                style={{
                  borderRadius: '20px',
                  padding: '1.2rem',
                  background: '#fff',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
                }}
              >
                {section.title ? (
                  <h5
                    style={{
                      margin: 0,
                      marginBottom: section.description ? '0.75rem' : 0,
                      color: '#0f172a',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                    }}
                  >
                    {section.title}
                  </h5>
                ) : null}
                {section.description ? (
                  <p
                    style={{
                      margin: 0,
                      color: '#475569',
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {section.description}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div
              style={{
                borderRadius: '16px',
                background: 'rgba(248, 250, 252, 0.8)',
                border: '1px dashed rgba(15, 23, 42, 0.18)',
                padding: '1rem',
                color: '#64748b',
              }}
            >
              أضف عنوانًا أو وصفًا ليظهر هنا شكل الصفحة قبل الحفظ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
