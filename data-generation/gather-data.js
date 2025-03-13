const https = require('https');

// Simple GET helper returning a Promise with the response body
async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

// Fetch & parse HTML permissions from developer.android.com
async function extractHtmlPermissions() {
  const url = 'https://developer.android.com/reference/android/Manifest.permission';
  
  const html = (await fetchUrl(url)).replace(/\n/g, ' ');
  const divBlocks = [...html.matchAll(/<div\s+data-version-added=.*?<\p>[^<]+<\/div>/gs)];
  const results = [];

  for (const blockMatch of divBlocks) {
    const block = blockMatch[0];
    const apiLevelMatch = block.match(/data-version-added="([^"]+)"/);
    const apiLevel = apiLevelMatch?.[1];

    let permissionId;
    const pidDataText = block.match(/<h3[^>]*class="api-name"[^>]*data-text="([^"]+)/);
    if (pidDataText) {
      permissionId = pidDataText[1];
    }

    if (!permissionId) continue;

    let fullPermissionId;
    let protectionLevel;
    let description;

    const pTags = [...block.matchAll(/<p>.*?<\/p>/g)];
    for (const p of pTags) {
      const text = p[0]
        .replace(/<\/?p>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (text.startsWith('Protection level:')) {
        protectionLevel = text.replace('Protection level:', '').trim().split('|');
      } else if (text.startsWith('Constant Value:')) {
        const match = text.match(/android:permission="([^"]+)"/);
        if (match) fullPermissionId = match[1];
      } else if (text) {
        description = description ? `${description} ${text}` : text;
      }
    }
    description = description?.replace(/\s+/g, ' ');

    results.push({
      apiLevel,
      permissionId,
      fullPermissionId,
      description,
      protectionLevel,
    });
  }
  return results;
}

// Fetch & parse extra permissions from googlesource
async function extractExtraPermissions() {
  const url =
    'https://android.googlesource.com/platform/frameworks/base/+/refs/heads/android10-release/core/res/AndroidManifest.xml?format=TEXT';
  const encoded = await fetchUrl(url);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8').replace(/\n/g, ' ');
  const blocks = [...decoded.matchAll(/((?:<!--.*?-->)+\s*<permission\s+[^>]+\/>)/g)];
  const results = [];

  for (const blockMatch of blocks) {
    const block = blockMatch[0];

    const descriptionMatch = block.match(/<!--(.*?)-->/g);
    let description;
    if (descriptionMatch) {
      const lastComment = descriptionMatch[descriptionMatch.length - 1];
      description = lastComment.replace(/<!--|-->/g, '').trim().replace(/\s+/g, ' ');
    }

    const protectionLevelMatch = block.match(/android:protectionLevel="([^"]+)/);
    const protectionLevel = protectionLevelMatch?.[1].split('|');

    const fullPermissionIdMatch = block.match(/android:name="([^"]+)/);
    const fullPermissionId = fullPermissionIdMatch?.[1];

    const permissionId = fullPermissionId.split('.').pop();
    if (!permissionId) continue;

    results.push({
      description,
      fullPermissionId,
      permissionId,
      protectionLevel,
    });
  }
  return results;
}

// Merge results on permissionId
function mergePermissions(htmlPerms, extraPerms) {
  const htmlPermsMap = Object.fromEntries(htmlPerms.map(p => ([p.permissionId, p])));
  const extraPermsMap = Object.fromEntries(extraPerms.map(p => ([p.permissionId, p])));

  const combined = [...htmlPerms, ...extraPerms].reduce((acc, perm) => {
    const { permissionId } = perm;
    const existing = acc[permissionId];
    if (existing) {
      return { ...acc, [permissionId]: { ...existing, ...perm } };
    }
    return { ...acc, [permissionId]: perm };
  }, {});
  return Object.values(combined);
}

(async () => {
  try {
    const htmlPermissions = await extractHtmlPermissions();
    const extraPermissions = await extractExtraPermissions();
    const merged = mergePermissions(htmlPermissions, extraPermissions);
    console.log(JSON.stringify(merged, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
