/**
 * Context Pro Trial — Free top-tier (full Watch) for 14 days
 * Local-only, once-per-machine. Zero server cost. Designed to convert, not cannibalize.
 *
 * Rules (Sean Ellis / Balfour discipline):
 * - Generous first experience so user feels the must-have
 * - Hard finite window (14 days) so urgency exists
 * - Clear, non-annoying messaging
 * - No cloud, no telemetry of code — only local timestamp
 * - After expiry: block Watch with upgrade path (pack remains free forever)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const TRIAL_DAYS = 14;
const CONFIG_DIR = path.join(os.homedir(), '.config', 'context');
const TRIAL_FILE = path.join(CONFIG_DIR, 'trial.json');
const LICENSE_FILE = path.join(CONFIG_DIR, 'license.json'); // future: { key, email, activatedAt }

function machineFingerprint() {
  // Lightweight, non-PII fingerprint to prevent trivial multi-trial on same box
  const raw = [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model || ''].join('|');
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function getLicenseStatus() {
  // Future: real key validation against a simple signed token or offline license
  try {
    const raw = await fs.readFile(LICENSE_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data && data.key && data.key.startsWith('CTX-PRO-')) {
      return { status: 'licensed', ...data };
    }
  } catch { /* no license */ }
  return { status: 'none' };
}

export async function getTrialStatus() {
  try {
    const raw = await fs.readFile(TRIAL_FILE, 'utf8');
    const data = JSON.parse(raw);
    const started = new Date(data.startedAt).getTime();
    const now = Date.now();
    const expires = started + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const remainingMs = expires - now;
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

    if (remainingMs <= 0) {
      return {
        status: 'expired',
        startedAt: data.startedAt,
        expiresAt: new Date(expires).toISOString(),
        remainingDays: 0,
        fingerprint: data.fingerprint
      };
    }

    return {
      status: 'active',
      startedAt: data.startedAt,
      expiresAt: new Date(expires).toISOString(),
      remainingDays: Math.max(0, remainingDays),
      fingerprint: data.fingerprint
    };
  } catch {
    return { status: 'none' };
  }
}

export async function startTrialIfNeeded() {
  const existing = await getTrialStatus();
  if (existing.status !== 'none') return existing;

  await ensureConfigDir();
  const fingerprint = machineFingerprint();
  const startedAt = new Date().toISOString();
  const data = {
    startedAt,
    fingerprint,
    version: '0.3.0',
    note: 'Free top-tier (Watch + full Pro features) trial. One per machine.'
  };
  await fs.writeFile(TRIAL_FILE, JSON.stringify(data, null, 2), 'utf8');

  return {
    status: 'started',
    startedAt,
    expiresAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    remainingDays: TRIAL_DAYS,
    fingerprint
  };
}

/**
 * Gate for Watch (and future Pro-only features).
 * Returns { allowed: boolean, message?: string, status }
 * Pack remains always free. This is the conversion point.
 */
export async function checkProAccess(feature = 'watch') {
  const license = await getLicenseStatus();
  if (license.status === 'licensed') {
    return { allowed: true, status: 'licensed', message: null };
  }

  let trial = await getTrialStatus();
  if (trial.status === 'none') {
    trial = await startTrialIfNeeded();
    // First-time banner
    return {
      allowed: true,
      status: 'trial-started',
      message: [
        '',
        '╔══════════════════════════════════════════════════════════════════╗',
        '║  CONTEXT PRO — 14-DAY FREE TOP-TIER TRIAL STARTED                ║',
        '║                                                                  ║',
        '║  Full Watch mode + all Pro features unlocked for 14 days.        ║',
        '║  No credit card. No upload. Everything stays on your machine.    ║',
        '║                                                                  ║',
        '║  After the trial: upgrade at https://context.frobbmedia.com      ║',
        '║  or keep using free `context pack` forever.                      ║',
        '╚══════════════════════════════════════════════════════════════════╝',
        ''
      ].join('\n')
    };
  }

  if (trial.status === 'active') {
    const days = trial.remainingDays;
    const urgency = days <= 3 ? '  ⚠  Trial ending soon — convert while the habit is fresh.' : '';
    return {
      allowed: true,
      status: 'trial-active',
      message: `Context Pro trial · ${days} day${days === 1 ? '' : 's'} remaining${urgency}`
    };
  }

  // Expired
  return {
    allowed: false,
    status: 'trial-expired',
    message: [
      '',
      '╔══════════════════════════════════════════════════════════════════╗',
      '║  CONTEXT PRO TRIAL ENDED                                         ║',
      '║                                                                  ║',
      '║  Your 14-day free top-tier trial has expired.                    ║',
      '║                                                                  ║',
      '║  `context pack` remains free forever.                            ║',
      '║  `context watch` (the daily-driver habit) requires Pro.          ║',
      '║                                                                  ║',
      '║  → Upgrade in 60 seconds: https://context.frobbmedia.com/pro     ║',
      '║  → Or keep the free one-shot packer.                             ║',
      '╚══════════════════════════════════════════════════════════════════╝',
      ''
    ].join('\n')
  };
}

export async function printTrialInfo() {
  const license = await getLicenseStatus();
  if (license.status === 'licensed') {
    console.error('Status: Licensed Pro');
    return;
  }
  const trial = await getTrialStatus();
  if (trial.status === 'active') {
    console.error(`Status: Pro trial active · ${trial.remainingDays} days left · expires ${trial.expiresAt.slice(0, 10)}`);
  } else if (trial.status === 'expired') {
    console.error('Status: Pro trial expired · upgrade at https://context.frobbmedia.com/pro');
  } else {
    console.error('Status: No trial started yet · first `context watch` starts the 14-day free Pro trial');
  }
}
