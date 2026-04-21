import { formatLegalDate, parseLegalDocument, toLegalSections } from '@/utils/legalDocument';

interface LegalDocumentRendererProps {
  rawContent: string;
}

export default function LegalDocumentRenderer({ rawContent }: LegalDocumentRendererProps) {
  const document = parseLegalDocument(rawContent);
  const sections = toLegalSections(document);
  const formattedDate = formatLegalDate(document.updatedAt);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sections.map((section) => (
        <section
          key={section.id}
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: '24px',
            padding: '1.35rem 1.25rem',
            boxShadow: '0 22px 48px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {section.title ? (
            <h2
              style={{
                margin: 0,
                marginBottom: section.description ? '0.85rem' : 0,
                fontSize: '1.2rem',
                color: '#0f172a',
                fontWeight: 800,
              }}
            >
              {section.title}
            </h2>
          ) : null}

          {section.description ? (
            <p
              style={{
                margin: 0,
                color: '#334155',
                lineHeight: 2,
                whiteSpace: 'pre-wrap',
                fontSize: '1rem',
              }}
            >
              {section.description}
            </p>
          ) : null}
        </section>
      ))}

      {formattedDate ? (
        <div
          style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.95rem',
            marginTop: '0.5rem',
          }}
        >
          آخر تحديث: {formattedDate}
        </div>
      ) : null}
    </div>
  );
}
