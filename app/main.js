const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVER_PORT = 9880;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
// GitHub repo for release update checks
const UPDATE_REPO = 'wscnv93/qwen3-tts-mac-studio';
const APP_NAME = 'Qwen3-TTS';
const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // check every 30 minutes

// Backend project dir (contains server.py & .venv). Stored in userData/settings.json so it
// survives app updates. Resolution order: env -> saved settings -> null (user configures in
// Settings; the app opens straight to the setup flow when it is empty).
let settings = { projectDir: process.env.QWEN_TTS_PROJECT_DIR || '' };
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    settings = { projectDir: '', ...JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) };
  } catch {}
}

function saveSettings() {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
}

let win = null;
let serverProc = null;

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

async function isServerUp() {
  try {
    const r = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

function bundledServerPath() {
  if (!app.isPackaged) return null;
  const p = path.join(process.resourcesPath, 'backend', 'server', 'server');
  return fs.existsSync(p) ? p : null;
}

function spawnServer() {
  const bundled = bundledServerPath();
  let cmd, args, cwd;
  if (bundled) {
    cmd = bundled; args = []; cwd = path.dirname(bundled);
  } else {
    const dir = settings.projectDir;
    const server = path.join(dir, 'server.py');
    const python = path.join(dir, '.venv', 'bin', 'python');
    if (!fs.existsSync(server)) return `server.py not found in ${dir}`;
    if (!fs.existsSync(python)) {
      return `python not found at ${python} — create the venv first: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`;
    }
    cmd = python; args = ['server.py']; cwd = dir;
  }
  serverProc = spawn(cmd, args, {
    cwd,
    env: { ...process.env, QWEN_TTS_PORT: String(SERVER_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProc.stdout.on('data', (d) => send('server-log', d.toString()));
  serverProc.stderr.on('data', (d) => send('server-log', d.toString()));
  serverProc.on('exit', (code) => {
    send('server-log', `\n[backend exited code=${code}]\n`);
    serverProc = null;
  });
  return null;
}

ipcMain.handle('ensure-server', async () => {
  if (!settings.projectDir && !bundledServerPath()) return { ok: false, needsSetup: true };
  if (await isServerUp()) return { ok: true, alreadyRunning: true };
  if (!serverProc) {
    const err = spawnServer();
    if (err) {
      send('server-log', `[error] ${err}\n`);
      return { ok: false, error: err };
    }
  }
  for (let i = 0; i < 120; i++) { // model-less boot is fast; loading is lazy now
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerUp()) return { ok: true, started: true };
  }
  return { ok: false, error: 'backend start timeout, see log' };
});

ipcMain.handle('get-settings', () => ({ ...settings, settingsPath: settingsPath() }));
ipcMain.handle('save-settings', (_e, patch) => {
  settings = { ...settings, ...patch };
  saveSettings();
  return { ok: true };
});
ipcMain.handle('pick-directory', async (_e, title) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: title || 'Choose directory',
    properties: ['openDirectory', 'createDirectory'],
  });
  return canceled ? null : filePaths[0];
});
ipcMain.handle('open-external', (_e, url) => shell.openExternal(url));
ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('app-is-packaged', () => app.isPackaged);

// save synthesized audio: straight into audioSaveDir when configured, otherwise a native dialog
ipcMain.handle('save-wav', async (_e, arrayBuffer) => {
  const fname = `qwen3-tts-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`;
  const dir = settings.audioSaveDir;
  if (dir && fs.existsSync(dir)) {
    const fp = path.join(dir, fname);
    fs.writeFileSync(fp, Buffer.from(arrayBuffer));
    return { saved: true, filePath: fp };
  }
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: path.join(app.getPath('downloads'), fname),
    filters: [{ name: 'WAV audio', extensions: ['wav'] }],
  });
  if (canceled || !filePath) return { saved: false };
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  return { saved: true, filePath };
});

// ---- update check via GitHub Releases ----
function semverNewer(remote, local) {
  const p = (s) => s.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [a, b] = [p(remote), p(local)];
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

async function checkUpdate() {
  try {
    const r = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, {
      headers: { 'User-Agent': APP_NAME },
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 404) return { updateAvailable: false, error: 'no releases yet' };
    if (!r.ok) return { updateAvailable: false, error: `HTTP ${r.status}` };
    const j = await r.json();
    const latest = j.tag_name || '';
    const current = app.getVersion();
    const dmg = (j.assets || []).find((a) => a.name.endsWith('.dmg'));
    const zip = (j.assets || []).find((a) => a.name.endsWith('.zip'));
    return {
      updateAvailable: semverNewer(latest, current),
      current, latest, url: j.html_url,
      dmgUrl: dmg ? dmg.browser_download_url : null,
      zipUrl: zip ? zip.browser_download_url : null,
      notes: (j.body || '').slice(0, 800),
    };
  } catch (e) {
    return { updateAvailable: false, error: e.message };
  }
}

ipcMain.handle('check-update', () => checkUpdate());

// ---- in-app auto update: download the new .app zip, swap the bundle, relaunch ----
// unsigned app, so Squirrel-style updates are unavailable; we replace the bundle
// ourselves. Works when the app sits in a user-writable location (e.g. /Applications).
async function downloadUpdateZip(url, dest) {
  const res = await net.fetch(url, { redirect: 'follow' }); // Chromium stack: honors system proxy
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const out = fs.createWriteStream(dest);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    out.write(Buffer.from(value));
    if (total) send('update-progress', Math.round((received / total) * 100));
  }
  await new Promise((r) => out.end(r));
}

ipcMain.handle('apply-update', async () => {
  try {
    const info = await checkUpdate();
    if (!info.updateAvailable) return { ok: false, error: 'already up to date' };
    if (!info.zipUrl) return { ok: false, error: 'update package missing (no .zip asset in release)' };
    const tmp = app.getPath('temp');
    const zipPath = path.join(tmp, `qwen3-tts-update-${info.latest}.zip`);
    const extractDir = path.join(tmp, `qwen3-tts-update-${info.latest}`);
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });
    send('update-progress', 0);
    await downloadUpdateZip(info.zipUrl, zipPath);
    send('update-progress', 100);
    await new Promise((resolve, reject) => {
      const p = spawn('/usr/bin/ditto', ['-x', '-k', zipPath, extractDir]);
      p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`unzip failed (${c})`))));
      p.on('error', reject);
    });
    const extracted = fs.readdirSync(extractDir).find((n) => n.endsWith('.app'));
    if (!extracted) return { ok: false, error: 'update package invalid' };
    const appPath = path.dirname(path.dirname(path.dirname(process.execPath)));
    const newApp = path.join(extractDir, extracted);
    const script = `
      sleep 1
      rm -rf "${appPath}.old"
      if mv "${appPath}" "${appPath}.old"; then
        mv "${newApp}" "${appPath}" && rm -rf "${appPath}.old" "${extractDir}" "${zipPath}" && open "${appPath}" || mv "${appPath}.old" "${appPath}"
      fi
    `;
    spawn('/bin/sh', ['-c', script], { detached: true, stdio: 'ignore' }).unref();
    setTimeout(() => app.quit(), 500);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(() => {
  loadSettings();
  // dev mode (`electron .`) shows the Electron binary icon in the Dock;
  // packaged builds already carry the icon in their bundle, and icon_1024.png
  // is not inside app.asar — only touch the Dock when running unpacked
  if (process.platform === 'darwin' && app.dock && !app.isPackaged) {
    try {
      app.dock.setIcon(path.join(__dirname, 'icon_1024.png'));
    } catch {}
  }
  win = new BrowserWindow({
    width: 1120,
    height: 800,
    minWidth: 940,
    minHeight: 660,
    backgroundColor: '#0f1115',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('console-message', (_e, level, message) => console.log(`[renderer] ${message}`));

  // launch update check + periodic polling ("near real-time" prompts)
  const tick = async () => {
    const res = await checkUpdate();
    if (res.updateAvailable) send('update-available', res);
  };
  setTimeout(tick, 5000);
  setInterval(tick, UPDATE_INTERVAL_MS);

  // e2e UI test hook
  if (process.env.RUN_UI_TEST) {
    win.webContents.on('did-finish-load', async () => {
      const js = `(async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        const $ = (id) => document.getElementById(id);
        for (let i = 0; i < 60; i++) { if ($('statusDot').classList.contains('on')) break; await sleep(1000); }
        // 1. preset voice synthesis
        $('pBtn').click();
        for (let i = 0; i < 90; i++) { if ($('pResult').style.display === 'block') break; await sleep(1000); }
        const t1 = $('pResult').style.display === 'block' && $('pAudio').src.startsWith('blob:');
        // 2. clone flow
        const b = await (await fetch('${SERVER_URL}/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '客户端测试参考音频,大家好呀。', speaker: 'eric' }) })).blob();
        cStore.file = new File([b], 'ref.wav', { type: 'audio/wav' });
        $('cRefText').value = '客户端测试参考音频,大家好呀。';
        $('cText').value = '这是克隆链路端到端测试。';
        $('cBtn').click();
        for (let i = 0; i < 180; i++) { if ($('cResult').style.display === 'block') break; await sleep(1000); }
        const t2 = $('cResult').style.display === 'block' && $('cAudio').src.startsWith('blob:');
        // 3. save as preset -> appears in preset select -> generate
        // SAFETY: diff the voice registry before/after so cleanup can only ever
        // remove the preset THIS test created — never a pre-existing user preset.
        const idsBefore = new Set((await (await fetch('${SERVER_URL}/clone/voices')).json()).voices.map((v) => v.voice_id));
        $('cPresetName').value = 'E2E预设';
        $('cSavePresetBtn').click();
        for (let i = 0; i < 60; i++) { if ($('cPresetHint').textContent.includes('已存为') || $('cPresetHint').textContent.includes('saved')) break; await sleep(1000); }
        let newId = null;
        for (let i = 0; i < 30 && !newId; i++) {
          const after = (await (await fetch('${SERVER_URL}/clone/voices')).json()).voices.map((v) => v.voice_id);
          newId = after.find((id) => !idsBefore.has(id)) || null;
          if (!newId) await sleep(1000);
        }
        const presetOpt = newId ? [...$('pSpeaker').options].find((o) => o.value === 'voice:' + newId) : null;
        let t3 = !!presetOpt;
        if (t3) {
          $('pSpeaker').value = presetOpt.value;
          $('pText').value = '预设音色端到端测试。';
          const oldSrc = $('pAudio').src;
          $('pBtn').click();
          for (let i = 0; i < 120; i++) { if ($('pAudio').src !== oldSrc) break; await sleep(1000); }
          t3 = $('pAudio').src !== oldSrc && $('pAudio').src.startsWith('blob:');
          await fetch('${SERVER_URL}/clone/voice/' + newId, { method: 'DELETE' });
        }
        const idsAfter = (await (await fetch('${SERVER_URL}/clone/voices')).json()).voices.map((v) => v.voice_id).sort();
        const presets_safe = JSON.stringify(idsAfter) === JSON.stringify([...idsBefore].sort());
        // 4. clear-all on clone page
        $('cRefText').value = 'x'; $('cText').value = 'y'; $('cPresetName').value = 'z';
        $('cClearBtn').click();
        const t4 = cStore.file === null && $('cRefText').value === '' && $('cText').value === ''
          && $('cPresetName').value === '' && $('cResult').style.display === 'none';
        // 5. settings: language switch + config round-trip
        document.querySelector('.nav-item[data-view=settings]').click();
        await sleep(300);
        const t5a = $('view-settings').classList.contains('active');
        langSelect.value = 'en'; langSelect.dispatchEvent(new Event('change'));
        await sleep(200);
        const t5b = $('pBtn').textContent.includes('Generate');
        langSelect.value = 'zh'; langSelect.dispatchEvent(new Event('change'));
        const t5c = ($('cfgCvStatus') || {}).textContent !== undefined;
        return { preset_ok: t1, clone_ok: t2, preset_voice_ok: t3, clear_ok: t4, settings_ok: t5a && t5b && t5c, presets_safe };
      })()`;
      try {
        const res = await win.webContents.executeJavaScript(js, false);
        console.log('[UI TEST RESULT]', JSON.stringify(res));
      } catch (e) {
        console.log('[UI TEST ERROR]', e.message);
      }
      app.quit();
    });
  }
});

app.on('before-quit', () => {
  if (serverProc) serverProc.kill();
});
app.on('window-all-closed', () => app.quit());
