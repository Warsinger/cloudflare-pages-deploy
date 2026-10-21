export async function updatePreviewComment(github, pr, url, sha, runURL, { repo, hostname, title, marker }) {
  const runPrefix = `https://github.com/${repo}/actions/runs/`;
  if (!/^[1-9][0-9]*$/.test(String(pr)) || url !== `https://pr-${pr}.${hostname}/` ||
      !/^[a-f0-9]{40}$/.test(sha) || !runURL.startsWith(runPrefix) || !/^[0-9]+$/.test(runURL.slice(runPrefix.length))) {
    throw new Error('Invalid preview comment target');
  }
  const body = `${marker}\n## Browser preview\n\n[Open ${title}](${url})\n\nRevision: \`${sha}\` · [Build and deployment](${runURL})\n`;
  let existing;
  for (let page = 1; ; page++) {
    const comments = await github(`issues/${pr}/comments?per_page=100&page=${page}`);
    existing = comments.find(comment => comment.user?.login === 'github-actions[bot]' && comment.body?.includes(marker));
    if (existing || comments.length < 100) break;
  }
  if (existing) {
    if (existing.body === body) return existing;
    return github(`issues/comments/${existing.id}`, { method: 'PATCH', body: { body } });
  }
  return github(`issues/${pr}/comments`, { method: 'POST', body: { body } });
}

