/**
 * Context Pro Trial — Free top-tier (full Watch) for 14 days
 * Local-only, once-per-machine. Zero server cost.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const TRIAL_DAYS = 14;
const CONFIG_DIR = path.join(os.homedir(), '.config', 'context');
const TRIAL_FILE = path.join(CONFIG_DIR, 'trial.json');
const LICENSE_FILE = path.join(CONFIG_DIR, 'license.json');

function machineFingerprint() {
  const raw = [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model || ''].join('|');
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function getLicenseStatus() {
  try {
    const raw = await fs.readFile(LICENSE_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data && data.key && data.key.startsWith('CTX-PRO-')) {
      return { status: 'licensed', ...data };
    }
  } catch {}
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
      return { status: 'expired', startedAt: data.startedAt, expiresAt: new Date(expires).toISOString(), remainingDays: 0, fingerprint: data.fingerprint };
    }
    return { status: 'active', startedAt: data.startedAt, expiresAt: new Date(expires).toISOString(), remainingDays: Math.max(0, remainingDays), fingerprint: data.fingerprint };
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
  const data = { startedAt, fingerprint, version: '0.3.1', note: 'Free top-tier Watch trial. One per machine.' };
  await fs.writeFile(TRIAL_FILE, JSON.stringify(data, null, 2), 'utf8');
  return { status: 'started', startedAt, expiresAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(), remainingDays: TRIAL_DAYS, fingerprint };
}

export async function checkProAccess(feature = 'watch') {
  const license = await getLicenseStatus();
  if (license.status === 'licensed') return { allowed: true, status: 'licensed', message: null };

  let trial = await getTrialStatus();
  if (trial.status === 'none') {
    trial = await startTrialIfNeeded();
    return {
      allowed: true,
      status: 'trial-started',
      message: [
        '',
        'Context Pro — 14-day free trial started',
        'Full Watch mode unlocked. No credit card. Nothing leaves your machine.',
        'After 14 days: context pack stays free · Watch requires Pro.',
        'https://context.frobbmedia.com',
        ''
      ].join('\n')
    };
  }

  if (trial.status === 'active') {
    const days = trial.remainingDays;
    const urgency = days <= 3 ? ' · trial ending soon' : '';
    return {
      allowed: true,
      status: 'trial-active',
      message: `Pro trial · ${days} day${days === 1 ? '' : 's'} remaining${urgency}`
    };
  }

  return {
    allowed: false,
    status: 'trial-expired',
    message: [
      '',
      'Context Pro trial ended.',
      'context pack remains free forever.',
      'context watch requires Pro → https://context.frobbmedia.com/pro',
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
    console.error('Status: Pro trial expired · https://context.frobbmedia.com/pro');
  } else {
    console.error('Status: No trial yet · first `context watch` starts the 14-day free Pro trial');
  }
}

export async function generateInviteCode() {
  const fingerprint = machineFingerprint().slice(0, 6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CTX-${fingerprint}-${rand}`;
}

export function formatInviteMessage(code) {
  return [
    `I'm using Context — local-first git-aware context packs for LLMs.`,
    `14-day free full Pro trial of Watch mode. Zero upload.`,
    ``,
    `npm i -g @frobb-media/context && context watch .`,
    ``,
    `Invite: ${code}`,
    `https://context.frobbmedia.com`
  ].join('\n');
}
