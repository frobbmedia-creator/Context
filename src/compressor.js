/**
 * Structural compressor — deterministic, language-aware elision
 * Upgraded from browser version with slightly better JS/TS/Python handling.
 */

export function transformText(text, mode = 'structural', language = 'Text') {
  if (!text) return '';
  if (mode === 'full') return normalizeText(text);
  if (mode === 'summary') return summarizeText(text);
  if (mode === 'structural') return structuralText(text, language);
  return compactText(text);
}

function normalizeText(text) {
  return text.replace(/\r\n/g, '\n').replace(/\u0000/g, '');
}

function compactText(text) {
  return normalizeText(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.trim() || lines[index - 1]?.trim())
    .join('\n');
}

function summarizeText(text) {
  const lines = compactText(text).split('\n');
  const important = lines.filter((line) =>
    /^(#|import |export |class |function |interface |type |const |let |var |def |pub |package |module |describe\(|it\(|test\()/i.test(
      line.trim()
    )
  );
  return important.slice(0, 240).join('\n') || lines.slice(0, 120).join('\n');
}

function structuralText(text, language) {
  const normalized = compactText(text);
  if (/Markdown|Text/.test(language)) return summarizeText(text);
  if (/JavaScript|TypeScript|React|Vue|Svelte/.test(language)) return structuralJsTs(normalized);
  if (language === 'Python') return structuralPython(normalized);
  if (/Rust|Go|Java|C\+\+|C\/C\+\+|C\b|Swift|Kotlin|Ruby|PHP/.test(language)) {
    return structuralBraceLanguage(normalized);
  }
  if (/JSON|YAML|TOML/.test(language)) return structuralData(normalized);
  return summarizeText(text);
}

function structuralJsTs(text) {
  const lines = text.split('\n');
  const output = [];
  let blockComment = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^\/\*\*/.test(trimmed)) {
      blockComment = [trimmed];
      while (!/\*\/\s*$/.test(lines[i]?.trim() || '') && i + 1 < lines.length) {
        i += 1;
        blockComment.push(lines[i].trim());
      }
      continue;
    }

    if (isJsStructuralLine(trimmed)) {
      if (blockComment.length) {
        output.push(...blockComment.slice(0, 6));
        blockComment = [];
      }
      output.push(elideJsLine(trimmed));
    }
  }
  return limitStructural(output, text);
}

function isJsStructuralLine(line) {
  return (
    /^(import|export\s+(type|interface|class|function|const|let|var|enum|default)|interface|type|class|function|const\s+\w+\s*=\s*(async\s*)?\(|const\s+\w+\s*=\s*[^=]*=>|async function)/.test(
      line
    ) || /^(public|private|protected|static|async|get|set)\s+[\w$]+\s*\(/.test(line)
  );
}

function elideJsLine(line) {
  if (/^import\b/.test(line) || /^export\s+.*from\b/.test(line)) return line;
  if (/[{]\s*$/.test(line)) return `${line} /* ... */ }`;
  if (/=>\s*[{(]/.test(line)) return line.replace(/=>\s*[{(].*$/, '=> /* ... */');
  return line.replace(/\s*{\s*.*$/, ' { /* ... */ }');
}

function structuralPython(text) {
  const lines = text.split('\n');
  const output = [];
  let decorators = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^from\s+\S+\s+import\b|^import\s+\S+/.test(trimmed)) {
      output.push(trimmed);
    } else if (/^@\w/.test(trimmed)) {
      decorators.push(trimmed);
    } else if (/^(async\s+)?def\s+\w+\(|^class\s+\w+/.test(trimmed)) {
      const indent = line.match(/^\s*/)[0];
      output.push(...decorators.map((d) => `${indent}${d}`));
      decorators = [];
      output.push(`${indent}${trimmed} ...`);
    }
  }
  return limitStructural(output, text);
}

function structuralBraceLanguage(text) {
  const lines = text.split('\n');
  const output = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(package|module|namespace|using|#include|import|use\s|pub use|extern crate)\b/.test(trimmed)) {
      output.push(trimmed);
    } else if (
      /^(pub\s+)?(struct|enum|trait|impl|fn|func|class|interface|record|public|private|protected|static|final|open|data|sealed)\b/.test(
        trimmed
      )
    ) {
      output.push(elideBraceLine(trimmed));
    } else if (/^[A-Za-z_][\w:<>,\s*&?.\[\]-]+\s+\w+\s*\([^;]*\)\s*[{;]?$/.test(trimmed)) {
      output.push(elideBraceLine(trimmed));
    }
  }
  return limitStructural(output, text);
}

function elideBraceLine(line) {
  if (line.endsWith(';')) return line;
  return line.replace(/\s*{\s*.*$/, ' { /* ... */ }');
}

function structuralData(text) {
  return text.split('\n').slice(0, 160).join('\n');
}

function limitStructural(lines, fallbackText) {
  const unique = [];
  const seen = new Set();
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      unique.push(line);
    }
  }
  return unique.slice(0, 420).join('\n') || summarizeText(fallbackText);
}
