/**
 * Context Score — lightweight, shareable social-proof metric
 * Pure local. No network. Optional to print / copy.
 *
 * Formula (transparent):
 *   Score = (token savings % * 0.55) + (priority hit rate * 0.30) + (budget efficiency * 0.15)
 *   Clamped 0–100
 */

export function computeContextScore(stats, records = []) {
  const { tokens = 0, saved = 0, included = 0, total = 0, available = 0 } = stats || {};

  const fullTokens = tokens + saved;
  const savingsPct = fullTokens > 0 ? (saved / fullTokens) * 100 : 0;

  // Priority hit rate: how much of the packed content came from high-priority (changed) files
  let highPriorityTokens = 0;
  let packedTokens = 0;
  for (const r of records) {
    if (!r.included) continue;
    packedTokens += r.tokens || 0;
    if ((r.priority || 0) >= 80) highPriorityTokens += r.tokens || 0;
  }
  const priorityHit = packedTokens > 0 ? (highPriorityTokens / packedTokens) * 100 : 50;

  // Budget efficiency: how close we got to using the available budget without overflowing
  const budgetEff = available > 0 ? Math.min(100, (tokens / available) * 100) : 50;

  const raw = (savingsPct * 0.55) + (priorityHit * 0.30) + (budgetEff * 0.15);
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  return {
    score,
    savingsPct: Math.round(savingsPct),
    priorityHit: Math.round(priorityHit),
    budgetEff: Math.round(budgetEff),
    tokens,
    saved,
    included,
    label: scoreLabel(score)
  };
}

function scoreLabel(score) {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}

export function formatScoreLine(scoreObj) {
  if (!scoreObj) return '';
  return `Context Score ${scoreObj.score}/100 (${scoreObj.label}) · ${scoreObj.savingsPct}% tokens saved · ${scoreObj.priorityHit}% high-priority`;
}

export function formatShareableScore(scoreObj, root = '.') {
  if (!scoreObj) return '';
  return [
    `Context Score: ${scoreObj.score}/100 (${scoreObj.label})`,
    `Workspace: ${root}`,
    `Tokens used: ${scoreObj.tokens}  |  Saved: ${scoreObj.saved} (${scoreObj.savingsPct}%)`,
    `High-priority hit rate: ${scoreObj.priorityHit}%`,
    `Built with https://context.frobbmedia.com  (local-first, zero upload)`
  ].join('\n');
}
