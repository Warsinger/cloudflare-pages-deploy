export async function pagesProject(fetcher, base, headers, project) {
  const response = await fetcher(`${base}/${encodeURIComponent(project)}`, { headers });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const codes = (detail.errors || []).map(error => error.code).filter(code => Number.isInteger(code)).join(",");
    throw new Error(`Cloudflare project lookup failed: HTTP ${response.status}; error codes: ${codes || "unavailable"}`);
  }
  const result = await response.json();
  if (!result.success || result.result?.name !== project || result.result.production_branch !== 'main' || result.result.source) {
    throw new Error('Expected the configured Direct Upload project with production branch main');
  }
  return result.result;
}
