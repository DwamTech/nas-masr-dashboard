export type LegalBlockType = 'title' | 'description';

export interface LegalDocumentBlock {
  id: string;
  type: LegalBlockType;
  content: string;
}

export interface LegalDocumentData {
  version: 1;
  updatedAt?: string;
  blocks: LegalDocumentBlock[];
}

export interface LegalSection {
  id: string;
  title?: string;
  description?: string;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createBlock(type: LegalBlockType, content = ''): LegalDocumentBlock {
  return {
    id: createId(type),
    type,
    content,
  };
}

export function createEmptyLegalDocument(): LegalDocumentData {
  return {
    version: 1,
    blocks: [createBlock('title'), createBlock('description')],
  };
}

function normalizeLegacyBlock(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
}

function looksLikeTitle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  if (/[.!؟:؛]/.test(trimmed)) return false;
  return trimmed.split(/\s+/).length <= 8;
}

function parseLegacyText(raw: string): LegalDocumentData {
  const chunks = raw
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map(normalizeLegacyBlock)
    .filter(Boolean);

  if (chunks.length === 0) {
    return createEmptyLegalDocument();
  }

  return {
    version: 1,
    blocks: chunks.map((chunk) => createBlock(looksLikeTitle(chunk) ? 'title' : 'description', chunk)),
  };
}

function sanitizeParsedDocument(input: Partial<LegalDocumentData> | null | undefined): LegalDocumentData | null {
  if (!input || typeof input !== 'object' || !Array.isArray(input.blocks)) {
    return null;
  }

  const blocks = input.blocks
    .map((block) => {
      if (!block || typeof block !== 'object') return null;

      const type = block.type === 'title' ? 'title' : block.type === 'description' ? 'description' : null;
      if (!type) return null;

      return {
        id: typeof block.id === 'string' && block.id.trim() ? block.id : createId(type),
        type,
        content: typeof block.content === 'string' ? block.content : '',
      } satisfies LegalDocumentBlock;
    })
    .filter((block): block is LegalDocumentBlock => Boolean(block));

  return {
    version: 1,
    updatedAt: typeof input.updatedAt === 'string' && input.updatedAt.trim() ? input.updatedAt : undefined,
    blocks: blocks.length ? blocks : createEmptyLegalDocument().blocks,
  };
}

export function parseLegalDocument(raw: string | null | undefined): LegalDocumentData {
  const value = String(raw ?? '').trim();
  if (!value) return createEmptyLegalDocument();

  try {
    const parsed = JSON.parse(value) as Partial<LegalDocumentData>;
    const normalized = sanitizeParsedDocument(parsed);
    if (normalized) return normalized;
  } catch {
    // Fall back to the legacy plain-text format.
  }

  return parseLegacyText(value);
}

export function serializeLegalDocument(document: LegalDocumentData): string {
  return JSON.stringify(document);
}

export function stampLegalDocument(document: LegalDocumentData, isoDate = new Date().toISOString()): LegalDocumentData {
  return {
    ...document,
    updatedAt: isoDate,
  };
}

export function toLegalSections(document: LegalDocumentData): LegalSection[] {
  const sections: LegalSection[] = [];
  let pendingTitle: string | undefined;

  for (const block of document.blocks) {
    const content = block.content.trim();
    if (!content) continue;

    if (block.type === 'title') {
      if (pendingTitle) {
        sections.push({
          id: `${block.id}-title-only`,
          title: pendingTitle,
        });
      }

      pendingTitle = content;
      continue;
    }

    sections.push({
      id: block.id,
      title: pendingTitle,
      description: content,
    });
    pendingTitle = undefined;
  }

  if (pendingTitle) {
    sections.push({
      id: `${pendingTitle}-tail`,
      title: pendingTitle,
    });
  }

  return sections;
}

export function formatLegalDate(updatedAt?: string) {
  if (!updatedAt) return null;

  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(updatedAt));
  } catch {
    return null;
  }
}
