/**
 * XML / JSON exporters with hygiene and omitted-file audit
 */

import { APP_VERSION, BUILD_ID } from './version.js';

function escapeAttr(text) {
  return String(text).replace(/[&<>"']/g, (char) =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }[char])
  );
}

function safeCdata(text) {
  return text.replaceAll(']]>', ']]]]><![CDATA[>');
}

function sanitizeXmlString(text) {
  if (!text) return '';
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function buildXml({ records, omitted, budget, reserved, tokens, prompt, includeOmitted = true }) {
  const body = records
    .map((record) => {
      const content = safeCdata(sanitizeXmlString(record.content || ''));
      const warnings = record.warnings?.length ? ` warnings="${escapeAttr(record.warnings.join(','))}"` : '';
      const hash = record.contentHash
        ? ` sha256="${escapeAttr(record.contentHash)}" hash_scope="${escapeAttr(record.hashScope || 'full-text')}"`
        : '';
      return `  <file path="${escapeAttr(record.path)}" language="${escapeAttr(record.language)}" tokens="${record.tokens}" tokenizer="${escapeAttr(record.tokenizer || 'Context local')}" compressor="${escapeAttr(record.compressor || 'Context')}" compression="${escapeAttr(record.compression)}"${hash}${warnings}>\n<![CDATA[\n${content}\n]]>\n  </file>`;
    })
    .join('\n');

  const omittedBody =
    includeOmitted && omitted.length
      ? `\n  <omitted_files count="${omitted.length}">\n${omitted
          .map(
            (r) =>
              `    <omitted path="${escapeAttr(r.path)}" reason="${escapeAttr(omitReason(r))}" tokens="${r.tokens || 0}" size="${r.size || 0}"${r.contentHash ? ` sha256="${escapeAttr(r.contentHash)}"` : ''} />`
          )
          .join('\n')}\n  </omitted_files>`
      : '';

  const userPrompt = (prompt || '').trim() || '[Describe the task here]';

  return `You are an expert developer. Below is the system context.\n\n<context_bundle app="Context" version="${APP_VERSION}" build="${BUILD_ID}" files="${records.length}" omitted="${omitted.length}" tokens="${tokens}" budget="${budget}" reserved="${reserved}">\n${body}${omittedBody}\n</context_bundle>\n\nUsing the context above, solve the following issue: ${userPrompt}\n`;
}

export function buildJson({ records, omitted, budget, reserved, available, used, saved, prompt, model }) {
  return JSON.stringify(
    {
      schema: 'context.bundle.v1',
      app: { name: 'Context', version: APP_VERSION, build: BUILD_ID },
      generatedAt: new Date().toISOString(),
      model,
      budget: { total: budget, reserved, available, used, remaining: available - used, saved },
      prompt: prompt || '',
      files: records.map((r) => ({
        path: r.path,
        language: r.language,
        size: r.size,
        contentHash: r.contentHash,
        hashScope: r.hashScope,
        tokens: r.tokens,
        fullTokens: r.fullTokens,
        priority: r.priority,
        compression: r.compression,
        warnings: r.warnings || [],
        content: r.content || ''
      })),
      omitted: omitted.map((r) => ({
        path: r.path,
        reason: omitReason(r),
        language: r.language,
        size: r.size,
        tokens: r.tokens || 0,
        priority: r.priority,
        binary: Boolean(r.binary)
      }))
    },
    null,
    2
  );
}

function omitReason(record) {
  if (record.binary) return 'binary-file';
  if (record.ignoreReason) return record.ignoreReason;
  return 'not-selected-or-over-budget';
}
