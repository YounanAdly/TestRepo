#!/usr/bin/env node
// Marafiq AI Review — entry point.
// Auto-detects GitHub Actions vs Azure DevOps, loads rules, calls the model,
// posts inline suggestions, exits non-zero when a critical finding blocks merge.

import { loadConfig, loadRuleCorpus } from './config.mjs';
import { collectDiff } from './diff.mjs';
import { buildSystemPrompt, buildUserPrompt } from './prompt.mjs';
import { createProvider } from './providers/index.mjs';
import { detectPlatform } from './platforms/index.mjs';
import {
  runReview,
  findingsToComments,
  renderSummary,
  mergeFindings,
  computeVerdict,
} from './review-runner.mjs';
import { scanDiff } from './rules-scanner.mjs';

async function main() {
  const cfg = await loadConfig();
  console.log(`[ai-review] provider=${cfg.provider} model=${cfg.model} dryRun=${cfg.dryRun} soft=${cfg.soft}`);

  const platform = await detectPlatform();
  console.log(`[ai-review] platform=${platform.name}`);

  const ctx = await platform.getContext();
  console.log(`[ai-review] PR #${ctx.prNumber} "${ctx.prTitle}" ${ctx.baseSha?.slice(0, 7)}..${ctx.headSha?.slice(0, 7)}`);

  const { files } = collectDiff({ baseSha: ctx.baseSha, headSha: ctx.headSha, cfg });
  console.log(`[ai-review] ${files.length} reviewable files after filters`);

  if (files.length === 0) {
    if (!cfg.dryRun) {
      await platform.postSummary(
        renderSummary({
          summary: 'No reviewable source files changed in this PR (only skipped paths were touched).',
          findings: [],
          verdict: 'comment',
          provider: cfg.provider,
          model: cfg.model,
        }),
        ctx.prNumber,
      );
    }
    console.log('[ai-review] nothing to review, exit 0');
    return 0;
  }

  // ── Layer 1: deterministic scanner ────────────────────────────────────
  // Regex-based rule checks that MUST pass. Runs before the AI so we know
  // about black-and-white violations no matter what the model says.
  const scannerFindings = scanDiff(files);
  console.log(`[ai-review] deterministic scanner: ${scannerFindings.length} finding(s)`);
  for (const f of scannerFindings) {
    console.log(`  🔍 [${f.severity}] ${f.file}:${f.line} — ${f.title}`);
  }

  // ── Layer 2: AI reviewer ──────────────────────────────────────────────
  const rulesCorpus = await loadRuleCorpus(cfg);
  const systemPrompt = buildSystemPrompt(rulesCorpus, cfg.focusAreas);
  const userPrompt = buildUserPrompt({
    prTitle: ctx.prTitle,
    prBody: ctx.prBody,
    prAuthor: ctx.prAuthor,
    filesDiff: files,
  });

  const provider = await createProvider(cfg);
  const { summary, findings: aiFindings } = await runReview({
    cfg,
    provider,
    systemPrompt,
    userPrompt,
  });
  console.log(`[ai-review] AI reviewer: ${aiFindings.length} finding(s)`);
  for (const f of aiFindings) {
    console.log(`  🤖 [${f.severity}] ${f.file}:${f.line} — ${f.title}`);
  }

  // ── Merge + compute verdict client-side ──────────────────────────────
  const findings = mergeFindings(scannerFindings, aiFindings);
  const verdict = computeVerdict(findings, cfg.failOnSeverity);
  console.log(`[ai-review] merged=${findings.length} verdict=${verdict}`);

  const summaryMd = renderSummary({
    summary,
    findings,
    verdict,
    provider: cfg.provider,
    model: cfg.model,
  });
  const comments = findingsToComments(findings);

  if (cfg.dryRun) {
    console.log('\n[ai-review] DRY RUN — not posting to PR.');
    await platform.postSummary(summaryMd, ctx.prNumber);
    await platform.postInlineComments({
      headSha: ctx.headSha,
      comments,
      prNumber: ctx.prNumber,
      event: 'COMMENT',
    });
  } else {
    await platform.postSummary(summaryMd, ctx.prNumber);
    // Only REQUEST_CHANGES ever changes GitHub's "checks passed" indicator via
    // the review state; the CI red X still comes from our exit code below.
    const event = verdict === 'request_changes' ? 'REQUEST_CHANGES' : 'COMMENT';
    await platform.postInlineComments({
      headSha: ctx.headSha,
      comments,
      prNumber: ctx.prNumber,
      event,
    });
  }

  const blocking = findings.filter((f) => cfg.failOnSeverity.includes(f.severity));
  if (blocking.length > 0) {
    if (cfg.soft) {
      console.log(
        `[ai-review] ${blocking.length} blocking finding(s) but AI_REVIEW_SOFT=1 — check passes anyway.`,
      );
    } else {
      console.error(
        `[ai-review] ${blocking.length} ${cfg.failOnSeverity.join('/')} finding(s) — failing the check.`,
      );
      console.error('[ai-review] Blocking findings:');
      for (const f of blocking) {
        console.error(`  · [${f.severity}] ${f.file}:${f.line} — ${f.title} (${f.source || 'ai'})`);
      }
      return 1;
    }
  }
  console.log('[ai-review] done, exit 0');
  return 0;
}

main()
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    console.error('[ai-review] fatal:', err.stack || err.message || err);
    // Exit 0 on infrastructure errors so a temporary API outage never blocks merges.
    // Set AI_REVIEW_HARD_FAIL=1 to override.
    process.exit(process.env.AI_REVIEW_HARD_FAIL === '1' ? 2 : 0);
  });
