(function () {
  const TOKENIZER_VERSION = "context-local-tokenizer-v1";

  const MODEL_PROFILES = {
    "gpt-5": {
      label: "OpenAI cl100k/o200k-style local estimator",
      codeWeight: 0.72,
      proseWeight: 0.74,
      charDivisor: 19,
      punctuationWeight: 0.42,
      newlineWeight: 0.18
    },
    claude: {
      label: "Claude-style local estimator",
      codeWeight: 0.68,
      proseWeight: 0.7,
      charDivisor: 20,
      punctuationWeight: 0.36,
      newlineWeight: 0.16
    },
    generic: {
      label: "Generic local estimator",
      codeWeight: 0.75,
      proseWeight: 0.75,
      charDivisor: 16,
      punctuationWeight: 0.5,
      newlineWeight: 0.2
    }
  };

  function estimateTokens(text, model = "gpt-5", language = "Text") {
    if (!text) return 0;
    const profile = MODEL_PROFILES[model] || MODEL_PROFILES.generic;
    const normalized = text.replace(/\r\n/g, "\n").replace(/\u0000/g, "");
    if (!normalized.trim()) return 0;

    const parts = segment(normalized);
    const wordWeight = isCodeLike(language) ? profile.codeWeight : profile.proseWeight;
    const structuralCount = parts.identifiers * wordWeight
      + parts.numbers * 0.7
      + parts.punctuation * profile.punctuationWeight
      + parts.whitespaceRuns * 0.08
      + parts.newlines * profile.newlineWeight;
    const bytePressure = new TextEncoder().encode(normalized).length / profile.charDivisor;

    return Math.max(1, Math.ceil(Math.max(structuralCount, bytePressure)));
  }

  function segment(text) {
    const matches = text.match(/[A-Za-z_$][\w$-]*|\d+(?:\.\d+)?|\s+|[^\sA-Za-z0-9_$]/g) || [];
    let identifiers = 0;
    let numbers = 0;
    let punctuation = 0;
    let whitespaceRuns = 0;
    let newlines = 0;

    for (const token of matches) {
      if (/^[A-Za-z_$]/.test(token)) identifiers += splitIdentifier(token);
      else if (/^\d/.test(token)) numbers += 1;
      else if (/^\s+$/.test(token)) {
        whitespaceRuns += 1;
        newlines += (token.match(/\n/g) || []).length;
      } else {
        punctuation += token.length;
      }
    }

    return { identifiers, numbers, punctuation, whitespaceRuns, newlines };
  }

  function splitIdentifier(identifier) {
    const parts = identifier
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[_\-\s]+/)
      .filter(Boolean);
    return Math.max(1, parts.length);
  }

  function isCodeLike(language) {
    return !/Markdown|Text|YAML|JSON|TOML/.test(language);
  }

  function tokenizerLabel(model) {
    return (MODEL_PROFILES[model] || MODEL_PROFILES.generic).label;
  }

  self.ContextTokenizer = {
    TOKENIZER_VERSION,
    estimateTokens,
    tokenizerLabel
  };
})();
