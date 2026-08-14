// Azure DevOps platform adapter.
// Uses the Git REST API to read PR context and post PR comment threads.
// Azure DevOps has no native "apply suggestion" button, but we render the fix as a
// ```suggestion code block so devs can copy-paste (and, if you switch to GitHub
// Advanced Security integration or Azure DevOps Suggestions, it will Just Work).

const API_VERSION = '7.1-preview.1';

export class AzurePlatform {
  constructor() {
    this.name = 'azure';
    this.token = process.env.SYSTEM_ACCESSTOKEN;
    this.collectionUri = (process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI || '').replace(/\/+$/, '');
    this.project = process.env.SYSTEM_TEAMPROJECT;
    this.repoId = process.env.BUILD_REPOSITORY_ID;
    this.prId = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;

    if (!this.token) throw new Error('SYSTEM_ACCESSTOKEN not set. Enable "Allow scripts to access OAuth token" in the pipeline.');
    if (!this.collectionUri) throw new Error('SYSTEM_TEAMFOUNDATIONCOLLECTIONURI not set.');
    if (!this.project) throw new Error('SYSTEM_TEAMPROJECT not set.');
    if (!this.repoId) throw new Error('BUILD_REPOSITORY_ID not set.');
    if (!this.prId) throw new Error('SYSTEM_PULLREQUEST_PULLREQUESTID not set — not running on a PR.');
  }

  async #ado(path, init = {}) {
    const url = `${this.collectionUri}/${encodeURIComponent(this.project)}/_apis/git/repositories/${this.repoId}${path}${path.includes('?') ? '&' : '?'}api-version=${API_VERSION}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AzureDevOps ${init.method || 'GET'} ${path} → ${res.status}: ${err.slice(0, 500)}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async getContext() {
    const pr = await this.#ado(`/pullRequests/${this.prId}`);
    return {
      prNumber: Number(this.prId),
      prTitle: pr.title,
      prBody: pr.description || '',
      prAuthor: pr.createdBy?.displayName || pr.createdBy?.uniqueName,
      baseSha: pr.lastMergeTargetCommit?.commitId || process.env.SYSTEM_PULLREQUEST_TARGETBRANCH,
      headSha: pr.lastMergeSourceCommit?.commitId || process.env.SYSTEM_PULLREQUEST_SOURCECOMMITID,
    };
  }

  async postSummary(markdown) {
    // No sticky-comment API in Azure — we post a new thread every run and title it
    // clearly so old ones are easy to find and resolve.
    const body = `**🤖 Marafiq AI Review**\n\n${markdown}`;
    await this.#ado(`/pullRequests/${this.prId}/threads`, {
      method: 'POST',
      body: JSON.stringify({
        comments: [{ parentCommentId: 0, content: body, commentType: 1 }],
        status: 1, // active
      }),
    });
  }

  async postInlineComments({ comments }) {
    for (const c of comments) {
      const thread = {
        comments: [{ parentCommentId: 0, content: c.body, commentType: 1 }],
        status: 1, // active
        threadContext: {
          filePath: c.path.startsWith('/') ? c.path : `/${c.path}`,
          rightFileStart: { line: c.line, offset: 1 },
          rightFileEnd: { line: c.endLine && c.endLine > c.line ? c.endLine : c.line, offset: 1 },
        },
      };
      try {
        await this.#ado(`/pullRequests/${this.prId}/threads`, {
          method: 'POST',
          body: JSON.stringify(thread),
        });
      } catch (err) {
        console.warn(`[ai-review] skipped comment on ${c.path}:${c.line} — ${err.message}`);
      }
    }
  }
}
