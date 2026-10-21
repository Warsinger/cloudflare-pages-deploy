export function configuration(env) {
  const { GITHUB_REPOSITORY: repo, PAGES_PROJECT: project, PAGES_HOSTNAME: hostname,
    PAGES_TITLE: title = 'Application', PAGES_COMMENT_MARKER: marker = '<!-- cloudflare-pages-preview -->' } = env;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo || '') ||
      !/^[a-z0-9][a-z0-9-]{0,62}$/.test(project || '') ||
      !/^[a-z0-9][a-z0-9-]*\.pages\.dev$/.test(hostname || '') ||
      !/^[A-Za-z0-9 ._-]{1,80}$/.test(title) || !/^<!-- [a-z0-9-]+ -->$/.test(marker)) {
    throw new Error('Invalid deployment configuration');
  }
  return { repo, project, hostname, title, marker };
}
