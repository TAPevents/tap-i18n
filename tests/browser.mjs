import path from 'node:path';
import {writeFile} from 'node:fs/promises';

export async function runBrowserTests(browser, url, deadline, directory) {
  const context = await browser.createBrowserContext();
  const pageErrors = [];
  const messages = [];
  let results;
  try {
    const page = await context.newPage();
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      messages.push('Browser error: ' + error.message);
      console.error('Browser error:', error.message);
    });
    page.on('console', message => {
      messages.push(message.text());
      try {
        const parsed = JSON.parse(message.text());
        if (parsed.stats && parsed.tests && parsed.failures) results = parsed;
      } catch {}
    });
    page.setDefaultTimeout(Math.max(1, deadline - Date.now()));
    await page.goto(url);
    // These completion fields are the public browser-driver protocol used by
    // meteortesting:mocha and meteortesting:browser-tests.
    await page.waitForFunction(() => window.testsDone === true);
    const failureCount = await page.evaluate(() => window.testFailures);
    if (!results || !Number.isInteger(results.stats.tests) || results.stats.tests <= 0 ||
        results.stats.failures !== 0 || results.stats.pending !== 0 || failureCount !== 0 || pageErrors.length) {
      const failures = results?.failures.map(test => ({test: test.fullTitle, error: test.err.message}));
      throw new Error(JSON.stringify({stats: results?.stats, failures, failureCount, pageErrors,
        diagnostics: path.join(directory, 'client.log')}, null, 2));
    }
    return results.stats.tests;
  } finally {
    // Keep diagnostics even when navigation or test completion times out.
    try {
      await writeFile(path.join(directory, 'client.log'), messages.join('\n'));
      if (results) await writeFile(path.join(directory, 'client-results.json'), JSON.stringify(results, null, 2));
    } finally {
      await context.close();
    }
  }
}
