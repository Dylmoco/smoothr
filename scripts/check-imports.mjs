import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const tmpFile = path.join(repoRoot, '.tmp', 'imports.raw.txt');
const reportJson = path.join(repoRoot, '.tmp', 'imports.report.json');
const reportCsv = path.join(repoRoot, '.tmp', 'imports.report.csv');

// Extensions considered during resolution
const extensions = ['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx'];

// Load tsconfig aliases
function loadTsconfigAliases() {
  const aliases = [];
  const tsconfigPath = path.join(repoRoot, 'smoothr', 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const paths = tsconfig?.compilerOptions?.paths || {};
      for (const key in paths) {
        const normalizedKey = key.replace('*', '');
        const targets = paths[key];
        if (Array.isArray(targets) && targets.length > 0) {
          let target = targets[0].replace('*', '');
          const abs = path.resolve(path.dirname(tsconfigPath), target);
          aliases.push({ from: normalizedKey, to: abs });
        }
      }
    } catch (e) {
      console.error('Failed to parse tsconfig.json:', e);
    }
  }
  return aliases;
}

const aliases = loadTsconfigAliases();

function applyAliases(spec) {
  for (const a of aliases) {
    if (spec.startsWith(a.from)) {
      return { applied: true, path: path.join(a.to, spec.slice(a.from.length)) };
    }
  }
  return { applied: false, path: spec };
}

function normalizeSpecifier(spec) {
  const startsWithDot = spec.startsWith('./');
  let norm = path.posix.normalize(spec).replace(/\\+/g, '/');
  if (startsWithDot && !norm.startsWith('./')) {
    norm = './' + norm;
  }
  return norm.endsWith('/') && !spec.endsWith('/') ? norm.slice(0, -1) : norm;
}

// Recursively find a case-correct path
function findCaseCorrectPath(targetPath) {
  const parts = targetPath.split(path.sep);
  let current = path.isAbsolute(targetPath) ? path.sep : '';
  for (const part of parts) {
    if (!part) continue;
    const dir = current || path.sep;
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir);
    const match = entries.find(e => e.toLowerCase() === part.toLowerCase());
    if (!match) return null;
    current = path.join(dir, match);
  }
  return current;
}

function resolveLocal(fromFile, spec) {
  const fileDir = path.dirname(fromFile);
  let normalized = normalizeSpecifier(spec);
  let absolute;
  if (normalized.startsWith('/')) {
    absolute = path.join(repoRoot, normalized);
  } else {
    const aliasRes = applyAliases(normalized);
    normalized = aliasRes.applied ? normalized : normalized; // keep spec
    absolute = aliasRes.applied
      ? aliasRes.path
      : path.resolve(fileDir, normalized);
  }
  const result = { resolved: false, fix: null, reason: '' };
  const tryPaths = [];
  const hasExt = path.extname(absolute) !== '';
  if (fs.existsSync(absolute)) {
    if (fs.statSync(absolute).isDirectory()) {
      for (const ext of extensions) {
        const idx = path.join(absolute, 'index' + ext);
        if (fs.existsSync(idx)) {
          const rel = path.relative(fileDir, idx).replace(/\\/g, '/');
          let newSpec = rel.startsWith('.') ? rel : './' + rel;
          const ext = path.extname(newSpec);
          if (['.ts', '.tsx', '.jsx'].includes(ext)) {
            newSpec = newSpec.slice(0, -ext.length) + '.js';
          }
          result.resolved = true;
          result.fix = normalizeSpecifier(newSpec);
          result.reason = 'directory-import';
          return result;
        }
      }
      result.reason = 'directory-missing-index';
      return result;
    }
    // existing file, but check case
    const caseCorrect = findCaseCorrectPath(absolute);
    if (caseCorrect && caseCorrect !== absolute) {
      const rel = path.relative(fileDir, caseCorrect).replace(/\\/g, '/');
      let newSpec = rel.startsWith('.') ? rel : './' + rel;
      result.resolved = true;
      result.fix = normalizeSpecifier(newSpec);
      result.reason = 'case-mismatch';
      return result;
    }
    result.resolved = true;
    return result;
  }

  if (hasExt) {
    const base = absolute.slice(0, -path.extname(absolute).length);
    for (const ext of extensions) {
      tryPaths.push(base + ext);
    }
  } else {
    for (const ext of extensions) {
      tryPaths.push(absolute + ext);
    }
  }
  for (const p of tryPaths) {
    if (fs.existsSync(p)) {
      const rel = path.relative(fileDir, p).replace(/\\/g, '/');
      let newSpec = rel.startsWith('.') ? rel : './' + rel;
      const ext = path.extname(newSpec);
      if (['.ts', '.tsx', '.jsx'].includes(ext)) {
        newSpec = newSpec.slice(0, -ext.length) + '.js';
      }
      result.resolved = true;
      result.fix = normalizeSpecifier(newSpec);
      result.reason = 'extension';
      return result;
    }
  }

  // case-insensitive search
  const caseCorrect = findCaseCorrectPath(absolute);
  if (caseCorrect && caseCorrect !== absolute) {
    const rel = path.relative(fileDir, caseCorrect).replace(/\\/g, '/');
    let newSpec = rel.startsWith('.') ? rel : './' + rel;
    result.resolved = true;
    result.fix = normalizeSpecifier(newSpec);
    result.reason = 'case-mismatch';
    return result;
  }

  // legacy storefronts path
  if (spec.includes('storefronts/supabase/')) {
    const newPath = spec.replace('storefronts/supabase/', 'supabase/');
    const relCand = resolveLocal(fromFile, newPath);
    if (relCand.resolved) {
      result.resolved = true;
      result.fix = relCand.fix || newPath;
      result.reason = 'legacy-supabase-path';
      return result;
    }
  }

  result.reason = 'not-found';
  return result;
}

function processFile(file, line, spec) {
  const ext = path.extname(file);
  if (!extensions.includes(ext)) return null;
  const isLocal = spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/') || aliases.some(a => spec.startsWith(a.from));
  const entry = { file, line, spec, reason: '', fix: '' };
  if (!isLocal) return null; // ignore bare modules
  const res = resolveLocal(file, spec);
  if (!res.resolved) {
    entry.reason = res.reason;
    return entry;
  }
  if (res.fix && res.fix !== spec) {
    entry.reason = res.reason;
    entry.fix = res.fix;
    applyFix(file, line, spec, res.fix);
    return entry;
  }
  return null; // no issue
}

function applyFix(file, line, oldSpec, newSpec) {
  const contents = fs.readFileSync(file, 'utf8').split('\n');
  const idx = line - 1;
  if (idx >= contents.length) return;
  const regex = new RegExp(oldSpec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  contents[idx] = contents[idx].replace(regex, newSpec);
  fs.writeFileSync(file, contents.join('\n'));
}

function main() {
  if (!fs.existsSync(tmpFile)) {
    console.error('Missing', tmpFile);
    process.exit(1);
  }
  const lines = fs.readFileSync(tmpFile, 'utf8').split('\n').filter(Boolean);
  const seen = new Set();
  const issues = [];
  for (const l of lines) {
    const [file, lineStr, ...rest] = l.split(':');
    const lineNum = parseInt(lineStr, 10);
    const content = rest.join(':');
    const match = content.match(/['\"]([^'\"]+)['\"]/);
    if (!match) continue;
    const spec = match[1];
    const key = file + ':' + lineNum + ':' + spec;
    if (seen.has(key)) continue;
    seen.add(key);
    const issue = processFile(path.resolve(repoRoot, file), lineNum, spec);
    if (issue) issues.push(issue);
  }
  fs.writeFileSync(reportJson, JSON.stringify(issues, null, 2));
  const csvLines = ['file,line,original,failure_reason,fix'];
  for (const i of issues) {
    csvLines.push(`${i.file},${i.line},${i.spec},${i.reason},${i.fix}`);
  }
  fs.writeFileSync(reportCsv, csvLines.join('\n'));
}

main();
