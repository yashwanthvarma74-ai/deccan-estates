export type CheckResult = 'PASS' | 'WARN' | 'FAIL';
export type Check = { key: string; label: string; result: CheckResult; note: string; source: string };
export type Report = { status: 'VERIFIED' | 'CAUTION' | 'RISK'; score: number; summary: string; checks: Check[] };

type Subject = { type: string; possession: string; approval: string | null; locality: string };

/** Tiny deterministic hash so the same listing always gets the same report. */
const roll = (n: number, salt: number) => {
  const x = Math.sin((n + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const WEIGHT: Record<CheckResult, number> = { PASS: 0, WARN: 8, FAIL: 22 };

function outcome(n: number, salt: number, warnAt: number, failAt: number): CheckResult {
  const r = roll(n, salt);
  return r > failAt ? 'FAIL' : r > warnAt ? 'WARN' : 'PASS';
}

const NOTES: Record<string, Record<CheckResult, string>> = {
  layout: {
    PASS: 'Layout approved; plot number appears in the approved plan.',
    WARN: 'Layout approval found, but this plot number needs a plan copy to confirm.',
    FAIL: 'No approved layout found for this survey number. Likely an unauthorised layout.',
  },
  zone: {
    PASS: 'Residential land use under the master plan.',
    WARN: 'Mixed or agricultural land use; conversion papers should be seen.',
    FAIL: 'Land use does not allow residential construction.',
  },
  water: {
    PASS: 'Outside lake full-tank level and buffer zones.',
    WARN: 'Close to a water-body buffer; confirm the exact boundary on site.',
    FAIL: 'Falls inside a full-tank-level or buffer zone. Construction is restricted.',
  },
  title: {
    PASS: 'Ownership chain traced for 30 years without a break.',
    WARN: 'A gap in the ownership chain; a legal opinion is advised.',
    FAIL: 'Broken chain of title. Do not proceed without legal clearance.',
  },
  encumbrance: {
    PASS: 'No mortgages or charges on the encumbrance certificate.',
    WARN: 'An old charge appears without a closure record.',
    FAIL: 'Active mortgage or attachment registered against the property.',
  },
  records: {
    PASS: 'Seller name and extent match the Dharani land record.',
    WARN: 'Extent differs slightly from the land record.',
    FAIL: 'Seller does not match the owner in the land record.',
  },
  litigation: {
    PASS: 'No court cases found against the property or the seller.',
    WARN: 'A closed case is on record; review the order.',
    FAIL: 'A pending court case concerns this property.',
  },
  rera: {
    PASS: 'RERA registration is valid and the project is in good standing.',
    WARN: 'RERA registration expires soon; ask for the extension.',
    FAIL: 'RERA registration is missing or lapsed.',
  },
  plan: {
    PASS: 'Building plan sanctioned; the built area matches the plan.',
    WARN: 'Minor deviation from the sanctioned plan.',
    FAIL: 'Construction exceeds the sanctioned plan.',
  },
  occupancy: {
    PASS: 'Occupancy certificate issued.',
    WARN: 'Occupancy certificate applied for, not yet issued.',
    FAIL: 'No occupancy certificate for a building that is already occupied.',
  },
  builder: {
    PASS: 'Developer has delivered earlier projects on time.',
    WARN: 'Some earlier projects were delivered late.',
    FAIL: 'Developer has unresolved buyer complaints.',
  },
};

export function buildReport(subject: Subject, n: number): Report {
  const checks: Check[] = [];
  const add = (key: string, label: string, source: string, salt: number, warnAt: number, failAt: number) => {
    const result = outcome(n, salt, warnAt, failAt);
    checks.push({ key, label, result, note: NOTES[key][result], source });
  };

  if (subject.type === 'PLOT') {
    add('layout', 'Layout approval', subject.approval ?? 'HMDA / DTCP', 1, 0.82, 0.96);
    add('zone', 'Land use zone', 'HMDA master plan', 2, 0.9, 0.98);
    add('water', 'Lake and buffer zones', 'HMDA FTL / buffer map', 3, 0.86, 0.96);
    add('title', 'Chain of title (30 years)', 'Sale deeds', 4, 0.84, 0.97);
    add('encumbrance', 'Encumbrance certificate', 'Registration dept.', 5, 0.85, 0.96);
    add('records', 'Land record match', 'Dharani', 6, 0.86, 0.97);
    add('litigation', 'Litigation search', 'Court records', 7, 0.9, 0.98);
  } else {
    add('rera', 'RERA registration', 'TS RERA', 11, 0.9, 0.98);
    add('plan', 'Sanctioned building plan', 'GHMC / HMDA', 12, 0.86, 0.97);
    if (subject.possession === 'READY') add('occupancy', 'Occupancy certificate', 'GHMC', 13, 0.82, 0.96);
    add('builder', 'Developer track record', 'RERA complaints', 14, 0.8, 0.96);
    add('title', 'Chain of title', 'Sale deeds', 15, 0.86, 0.97);
    add('encumbrance', 'Encumbrance certificate', 'Registration dept.', 16, 0.86, 0.97);
    add('litigation', 'Litigation search', 'Court records', 17, 0.9, 0.98);
  }

  const penalty = checks.reduce((sum, c) => sum + WEIGHT[c.result], 0);
  const score = Math.max(0, 100 - penalty);
  const fails = checks.filter((c) => c.result === 'FAIL').length;
  const warns = checks.filter((c) => c.result === 'WARN').length;
  const status = fails > 0 ? 'RISK' : warns > 1 || score < 90 ? 'CAUTION' : 'VERIFIED';
  const summary =
    status === 'VERIFIED'
      ? `All ${checks.length} checks passed. Clear to proceed with the usual agreement and registration.`
      : status === 'CAUTION'
        ? `${warns} item${warns === 1 ? '' : 's'} need a closer look before you pay a token amount.`
        : `${fails} serious issue${fails === 1 ? '' : 's'} found. Do not pay until these are resolved.`;
  return { status, score, summary, checks };
}
