const test = require('node:test');
const assert = require('node:assert/strict');
const { readGithubText } = require('../lib/mcp-security');

test('GitHub file reader falls back to the blob API for files over one megabyte', async () => {
  const content = Buffer.from('{"ok":true}').toString('base64');
  assert.equal(await readGithubText({ sha: 'small', encoding: 'base64', content }, async () => assert.fail('small files need no blob request')), '{"ok":true}');
  assert.equal(await readGithubText({ sha: 'large', encoding: 'none', content: '' }, async sha => {
    assert.equal(sha, 'large');
    return { sha, encoding: 'base64', content };
  }), '{"ok":true}');
});
