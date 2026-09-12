/* Qwen3-TTS Mac Studio — renderer logic (light theme, zh/en i18n) */
const API = 'http://127.0.0.1:9880';
const UPDATE_REPO = 'wscnv93/qwen3-tts-mac-studio';
const $ = (id) => document.getElementById(id);

/* ================= i18n ================= */
const I18N = {
  zh: {
    nav_preset: '预置音色', nav_clone: '声音克隆', nav_settings: '设置',
    preset_title: '预置音色合成', preset_sub: '9 种内置音色,支持 10 种语言和风格指令;你的克隆预设也会出现在音色列表里',
    clone_title: '声音克隆', clone_sub: '录制或上传 3~10 秒清晰人声 + 逐字稿,克隆合成或存为预设;下方列表管理已保存的预设',
    settings_title: '设置', settings_sub: '语言、后端服务、模型管理与应用更新',
    lbl_text: '合成文本', lbl_voice: '音色', lbl_language: '语言',
    lbl_instruct: '风格指令(可选,内置音色专用,如 "Very happy.")', ph_instruct: '留空则使用默认语气',
    lbl_ref_audio: '参考音频(点击选择或拖入 wav/mp3/m4a)', no_file: '未选择文件',
    ref_audio_hint: '建议:3 秒以上、无背景音乐、发音清晰', btn_record: '用麦克风录制', or_upload: '或直接上传文件,二选一',
    lbl_ref_text: '参考音频逐字稿(强烈建议填写,克隆效果更好)', ph_ref_text: '参考音频里说的原话,一字不差效果最佳',
lbl_target_text: '要合成的文本', ph_target_text: '用克隆的音色说这段话',
    btn_clone: '克隆合成', btn_clear: '一键清空', btn_save_preset: '存为预设音色',
    ph_preset_name: '预设名称(如:我的声音)', btn_generate: '生成语音', btn_save_wav: '保存 WAV',
    preview_title: '音色试听', preview_hint: '内置音色播报试听短句;克隆预设播放它的参考音频',
    preview_text: '你好,这是我的声音,很高兴认识你。',
    saved_presets: '已保存的预设音色', btn_refresh: '刷新',
    set_general: '通用', set_backend: '后端服务目录', set_audio: '音频保存',
    audio_hint: '生成音频的默认保存目录(此设置独立存储,不随版本升级变化)。留空:每次保存弹出选择窗口;设置后:点击「保存 WAV」直接存入该目录,文件名自动生成。', backend_hint: '指向包含 server.py 与 .venv 的项目目录(即后端代码所在位置)。修改后需重启应用生效。开源用户:克隆本仓库后在此填入仓库路径。',
    set_models: '模型管理', model_cv_name: '预置音色模型', model_clone_name: '音色克隆模型',
    model_cv_desc: '用途:内置 9 种音色、10 种语言、风格指令控制。"预置音色"页必需;缺失时该页无法合成。约 3.9GB。',
    model_clone_desc: '用途:用 3 秒参考音频克隆任意音色,并管理你的音色预设。"声音克隆"与"我的音色"页必需。约 3.9GB。',
    btn_browse: '浏览…', btn_save: '保存', btn_download: '下载模型',
    models_hint: '两个模型按需下载即可,只下载你要用的。路径留空时下载到默认目录(应用数据目录);也可以自行指定目录,下载会写入该目录。',
    set_update: '应用更新', current_version: '当前版本:', btn_check_update: '检查更新',
    btn_open_releases: '打开 Releases 页面', update_hint: '应用启动时及每 30 分钟自动检查新版本,发现新版本会在右上角提示。下载请前往 Releases 页面。',
    backend_log: '后端日志',
    status_on: '运行中', status_wait: '连接中…', status_off: '服务未运行',
    toast_boot_fail: '后端启动失败,请到"设置"检查后端目录', toast_needs_setup: '请先在"设置"中配置后端服务目录',
    toast_fetch_speakers: '获取音色列表失败', toast_input_text: '请输入合成文本',
    toast_gen_fail: '合成失败', toast_saved_to: '已保存到', toast_pick_ref: '请先选择参考音频',
    toast_pick_ref_mic: '请先选择或录制参考音频', toast_clone_fail: '克隆失败', toast_need_reftext: '存预设需要逐字稿(克隆效果更好),请先填写',
    toast_preset_saved: '预设已保存,在"预置音色"下拉里可直接选用', toast_preset_fail: '保存预设失败',
    toast_deleted: '音色已删除', toast_delete_fail: '删除失败',
    toast_cleared: '已清空,可以开始下一条克隆', toast_cleared_ok: '已清空,可以开始下一条克隆',
    toast_mic_denied: '麦克风权限被拒绝:请在 系统设置 → 隐私与安全性 → 麦克风 中允许 Qwen3-TTS',
    toast_mic_fail: '无法访问麦克风', toast_rec_done: '录音完成!记得填写你刚才说了什么(逐字稿)',
    toast_rec_fail: '录音处理失败', toast_instruct_ignored: '克隆预设不支持风格指令,本次已忽略',
    toast_config_saved: '配置已保存', toast_dl_started: '下载已开始', toast_dl_fail: '下载失败',
    toast_audio_saved: '已保存,立即生效',
    toast_up_to_date: '已是最新版本', toast_update_found: '发现新版本', toast_update_check_fail: '检查更新失败',
    toast_update_fail: '自动更新失败', toast_update_ready: '下载完成,正在安装并重启…', updating_progress: '更新中',
    toast_dir_saved: '已保存,重启应用后生效', toast_model_saved: '模型路径已保存',
    status_ready: '就绪', status_missing: '未就绪', status_downloading: '下载中',
    dl_complete: '下载完成', cfg_select_dir: '选择目录',
    updating_badge: '新版本', e2e_lang_test: 'Generate',
    gen_meta: (dur, cost) => `时长 ${dur}s,生成用时 ${cost}s`,
    rec_time: (m, s) => `● 录音中 ${m}:${s}(建议 3~10 秒)`,
    rec_done_hint: '录制完成,试听一下,没问题就填逐字稿',
    converting: '转换中…', input_text_ph: '输入文本合成', unnamed: '未命名',
    confirm_delete: '确认删除?', delete_btn: '删除', no_voices: '暂无已注册音色',
  },
  en: {
    nav_preset: 'Preset Voices', nav_clone: 'Voice Clone', nav_settings: 'Settings',
    preset_title: 'Preset Voice Synthesis', preset_sub: '9 built-in voices, 10 languages and style instructs. Your cloned presets also appear in the voice list.',
    clone_title: 'Voice Cloning', clone_sub: 'Record or upload 3-10s of clear speech + transcript, then clone it or save as a preset. Manage saved presets below.',
    settings_title: 'Settings', settings_sub: 'Language, backend service, model management and app updates.',
    lbl_text: 'Text', lbl_voice: 'Voice', lbl_language: 'Language',
    lbl_instruct: 'Style instruct (built-in voices only, e.g. "Very happy.")', ph_instruct: 'Leave empty for default tone',
    lbl_ref_audio: 'Reference audio (click or drag in wav/mp3/m4a)', no_file: 'No file selected',
    ref_audio_hint: 'Tips: 3s+ clean speech, no background music', btn_record: 'Record with mic', or_upload: 'or upload a file — either works',
    lbl_ref_text: 'Transcript of the reference audio (strongly recommended)', ph_ref_text: 'The exact words spoken in the reference audio',
lbl_target_text: 'Text to synthesize', ph_target_text: 'What the cloned voice should say',
    btn_clone: 'Clone & Synthesize', btn_clear: 'Clear all', btn_save_preset: 'Save as voice preset',
    ph_preset_name: 'Preset name (e.g. My voice)', btn_generate: 'Generate', btn_save_wav: 'Save WAV',
    preview_title: 'Voice preview', preview_hint: 'Built-in voices speak a short sample; cloned presets play their reference audio',
    preview_text: 'Hello, this is my voice. Nice to meet you.',
    saved_presets: 'Saved voice presets', btn_refresh: 'Refresh',
    set_general: 'General', set_backend: 'Backend directory', set_audio: 'Audio Saving',
    audio_hint: 'Default directory for saved WAVs (stored independently, survives app updates). Leave empty to ask every time; when set, Save WAV writes here directly with an auto-generated filename.', backend_hint: 'Point to the project folder containing server.py and .venv (the backend code). Restart the app to apply. Open-source users: clone this repo and set the path here.',
    set_models: 'Models', model_cv_name: 'Preset Voice Model', model_clone_name: 'Voice Clone Model',
    model_cv_desc: 'Purpose: 9 built-in voices, 10 languages and style instruct control. Required by the "Preset Voices" tab. ~3.9GB.',
    model_clone_desc: 'Purpose: clone any voice from ~3s of reference audio and manage your voice presets. Required by "Voice Clone" and "My Voices" tabs. ~3.9GB.',
    btn_browse: 'Browse…', btn_save: 'Save', btn_download: 'Download model',
    models_hint: 'Download only the model you need. An empty path downloads to the default app-data folder; a custom path receives the download directly (the folder is created if needed).',
    set_update: 'App Update', current_version: 'Current version:', btn_check_update: 'Check for updates',
    btn_open_releases: 'Open Releases page', update_hint: 'The app checks for updates at launch and every 30 minutes. Download new versions from the Releases page.',
    backend_log: 'Backend log',
    status_on: 'Running', status_wait: 'Connecting…', status_off: 'Backend not running',
    toast_boot_fail: 'Backend failed to start — check Backend directory in Settings', toast_needs_setup: 'Set the backend directory in Settings first',
    toast_fetch_speakers: 'Failed to load voices', toast_input_text: 'Please enter text',
    toast_gen_fail: 'Synthesis failed', toast_saved_to: 'Saved to', toast_pick_ref: 'Please select a reference audio',
    toast_pick_ref_mic: 'Please select or record a reference audio', toast_clone_fail: 'Clone failed', toast_need_reftext: 'Transcript is required to save a preset — please fill it in',
    toast_preset_saved: 'Preset saved — pick it in the Preset Voices dropdown', toast_preset_fail: 'Failed to save preset',
    toast_deleted: 'Voice deleted', toast_delete_fail: 'Delete failed',
    toast_cleared: 'Cleared — ready for the next clone', toast_cleared_ok: 'Cleared — ready for the next clone',
    toast_mic_denied: 'Microphone denied: allow Qwen3-TTS in System Settings → Privacy & Security → Microphone',
    toast_mic_fail: 'Cannot access microphone', toast_rec_done: 'Recording done! Remember to fill in the transcript.',
    toast_rec_fail: 'Recording processing failed', toast_instruct_ignored: 'Cloned presets do not support style instructs — ignored this time',
    toast_config_saved: 'Config saved', toast_dl_started: 'Download started', toast_dl_fail: 'Download failed',
    toast_audio_saved: 'Saved — applies immediately',
    toast_up_to_date: 'You are on the latest version', toast_update_found: 'New version available', toast_update_check_fail: 'Update check failed',
    toast_update_fail: 'Auto-update failed', toast_update_ready: 'Downloaded — installing and restarting…', updating_progress: 'Updating',
    toast_dir_saved: 'Saved — restart the app to apply', toast_model_saved: 'Model path saved',
    status_ready: 'Ready', status_missing: 'Missing', status_downloading: 'Downloading',
    dl_complete: 'Download complete', cfg_select_dir: 'Choose directory',
    updating_badge: 'Update', e2e_lang_test: 'Generate',
    gen_meta: (dur, cost) => `${dur}s of audio, generated in ${cost}s`,
    rec_time: (m, s) => `● Recording ${m}:${s} (3-10s recommended)`,
    rec_done_hint: 'Recorded — have a listen, then fill in the transcript',
    converting: 'Converting…', input_text_ph: 'Enter text to synthesize', unnamed: 'Unnamed',
    confirm_delete: 'Sure?', delete_btn: 'Delete', no_voices: 'No registered voices yet',
  },
};

let LANG = localStorage.getItem('qts-lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
const t = (k, ...a) => {
  const v = (I18N[LANG] || I18N.en)[k] ?? (I18N.en[k] ?? k);
  return typeof v === 'function' ? v(...a) : v;
};

function applyLang() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  rebuildSpeakerSelect();
  rebuildLangSelect();
  refreshModelChips();
  const emptySpan = $('vList').querySelector('.empty span');
  if (emptySpan) emptySpan.textContent = t('no_voices');
}

function rebuildLangSelect() {
  const sel = $('langSelect');
  if (sel.value !== LANG) sel.value = LANG;
}

/* ================= helpers ================= */
function toast(msg, ok = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (ok ? ' ok' : '');
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function hashCode(s) {
  let h = 0;
  const str = String(s || 'voice');
  for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) >>> 0;
  return h;
}

/* deterministic "voiceprint" avatar: five amber bars seeded by the voice name */
function voiceprintSVG(seed) {
  const h = hashCode(seed);
  let rects = '';
  for (let i = 0; i < 5; i++) {
    const v = ((h >>> (i * 4)) & 15) / 15;
    const b = 8 + Math.round(v * 20);
    const x = (6.6 + i * 5.5).toFixed(1);
    rects += `<rect x="${x}" y="${((38 - b) / 2).toFixed(1)}" width="3.2" height="${b}" rx="1.6"/>`;
  }
  return `<svg viewBox="0 0 38 38" style="width:22px;height:22px" fill="var(--accent)">${rects}</svg>`;
}

const TRASH_ICON = '<svg class="ic" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6"/></svg>';

function emptyVoicesHTML() {
  return `<div class="empty">
    <svg class="ic" viewBox="0 0 24 24"><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/></svg>
    <span>${t('no_voices')}</span>
  </div>`;
}

/* ---- waveform player: play/pause + seekable voiceprint progress ---- */
const PLAYERS = {};
function makePlayer(audioId, seed, visible) {
  const audio = $(audioId);
  audio.removeAttribute('controls');
  const n = 34, h = hashCode(seed);
  let bars = '';
  for (let i = 0; i < n; i++) {
    const v = Math.abs(Math.sin(i * 1.7 + (h % 89))) * 0.8 + 0.2;
    const b = Math.round(6 + v * 26);
    bars += `<rect class="b" x="${i * 6}" y="${((34 - b) / 2).toFixed(1)}" width="3.6" height="${b}" rx="1.8"/>`;
  }
  const wrap = document.createElement('div');
  wrap.className = 'player';
  wrap.innerHTML = `
    <button class="pl-btn" type="button" aria-label="play / pause">
      <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.3v13.4a1 1 0 0 0 1.55.84l10.2-6.7a1 1 0 0 0 0-1.68L9.55 4.46A1 1 0 0 0 8 5.3Z"/></svg>
      <svg class="i-pause" viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1.5"/><rect x="14" y="4.5" width="4" height="15" rx="1.5"/></svg>
    </button>
    <div class="pl-wave">
      <svg class="pl-svg base" viewBox="0 0 ${n * 6} 34" preserveAspectRatio="none">${bars}</svg>
      <svg class="pl-svg lit" viewBox="0 0 ${n * 6} 34" preserveAspectRatio="none" style="clip-path:inset(0 100% 0 0)">${bars}</svg>
    </div>
    <span class="pl-time">0:00</span>`;
  audio.insertAdjacentElement('afterend', wrap);
  const lit = wrap.querySelector('.lit'), timeEl = wrap.querySelector('.pl-time'), btn = wrap.querySelector('.pl-btn');
  const fmt = (s) => !isFinite(s) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const update = () => {
    const p = audio.duration ? Math.min(100, (audio.currentTime / audio.duration) * 100) : 0;
    lit.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    timeEl.textContent = fmt(audio.duration ? audio.currentTime : 0);
  };
  btn.onclick = () => { if (audio.src) audio.paused ? audio.play() : audio.pause(); };
  wrap.querySelector('.pl-wave').onclick = (e) => {
    if (!audio.duration || !isFinite(audio.duration)) return;
    const r = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  };
  audio.addEventListener('play', () => wrap.classList.add('playing'));
  audio.addEventListener('pause', () => wrap.classList.remove('playing'));
  audio.addEventListener('ended', () => wrap.classList.remove('playing'));
  audio.addEventListener('timeupdate', update);
  audio.addEventListener('loadedmetadata', update);
  PLAYERS[audioId] = {
    show: (v) => { wrap.style.display = v ? 'flex' : 'none'; },
    reset: () => {
      audio.pause(); audio.removeAttribute('src'); audio.load();
      lit.style.clipPath = 'inset(0 100% 0 0)';
      wrap.classList.remove('playing'); timeEl.textContent = '0:00';
    },
  };
  PLAYERS[audioId].show(!!visible);
}
function initPlayers() {
  makePlayer('pAudio', 'preset', true);
  makePlayer('cAudio', 'clone', true);
  makePlayer('cRefAudio', 'ref', false);
}

async function callApi(path, opts) {
  const r = await fetch(API + path, opts);
  if (!r.ok) {
    let detail = `HTTP ${r.status}`;
    try { detail = (await r.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  return r;
}

function showResult(blob, audioEl, metaEl, metaText, saveBtn, buffer) {
  audioEl.src = URL.createObjectURL(blob);
  metaEl.textContent = metaText;
  saveBtn.onclick = async () => {
    const res = await window.api.saveWav(buffer);
    if (res.saved) toast(`${t('toast_saved_to')} ${res.filePath}`, true);
  };
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

/* ================= status & boot ================= */
let booted = false;
async function setStatus(state, text) {
  $('statusDot').className = 'dot ' + state;
  $('statusText').textContent = text;
}
async function refreshStatus() {
  try {
    const r = await fetch(API + '/health', { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      const j = await r.json();
      await setStatus('on', `${t('status_on')} · ${j.device}`);
      healthCache = j;
      refreshModelChips();
      return true;
    }
  } catch {}
  setStatus('off', t('status_off'));
  return false;
}
let healthCache = null;

async function boot() {
  if (booted) return;
  booted = true;
  const res = await window.api.ensureServer();
  booted = false;
  if (res.ok) { await refreshStatus(); await initOptions(); await loadVoices(); }
  else {
    setStatus('off', t('status_off'));
    if (res.needsSetup) {
      backendSetupRequired = true;
      applyBackendCardVisibility();
      switchView('settings');
    }
    toast(res.needsSetup ? t('toast_needs_setup') : (res.error || t('toast_boot_fail')));
  }
}
window.api.onLog((line) => {
  const pre = $('logPre');
  pre.textContent += line;
  pre.scrollTop = pre.scrollHeight;
});

/* ================= voices / options ================= */
const SPEAKER_META = {
  vivian:   { zh: ['薇薇安', '中文女声', '👩'], en: ['Vivian', 'Chinese female', '👩'] },
  serena:   { zh: ['Serena', '英文女声', '👩‍🦰'], en: ['Serena', 'English female', '👩‍🦰'] },
  ryan:     { zh: ['Ryan', '英文男声', '👨'], en: ['Ryan', 'English male', '👨'] },
  aiden:    { zh: ['Aiden', '英文男声', '🧑'], en: ['Aiden', 'English male', '🧑'] },
  uncle_fu: { zh: ['福叔', '中文男声', '👴'], en: ['Uncle Fu', 'Chinese male', '👴'] },
  dylan:    { zh: ['Dylan', '北京话男声', '🎩'], en: ['Dylan', 'Beijing male', '🎩'] },
  eric:     { zh: ['Eric', '四川话男声', '🌶️'], en: ['Eric', 'Sichuan male', '🌶️'] },
  ono_anna: { zh: ['小野安娜', '日文女声', '🌸'], en: ['Ono Anna', 'Japanese female', '🌸'] },
  sohee:    { zh: ['Sohee', '韩文女声', '🌙'], en: ['Sohee', 'Korean female', '🌙'] },
};
const LANG_META = {
  auto:      { zh: '自动检测', en: 'Auto detect' },
  chinese:   { zh: '中文', en: 'Chinese' }, english: { zh: '英语', en: 'English' },
  japanese:  { zh: '日语', en: 'Japanese' }, korean: { zh: '韩语', en: 'Korean' },
  french:    { zh: '法语', en: 'French' }, german: { zh: '德语', en: 'German' },
  italian:   { zh: '意大利语', en: 'Italian' }, portuguese: { zh: '葡萄牙语', en: 'Portuguese' },
  russian:   { zh: '俄语', en: 'Russian' }, spanish: { zh: '西班牙语', en: 'Spanish' },
};

let builtinSpeakers = [];
let langList = [];
let voiceListCache = [];

function rebuildSpeakerSelect() {
  const sel = $('pSpeaker');
  const cur = sel.value;
  const mk = (s) => {
    const m = (SPEAKER_META[s] || {})[LANG] || [s, ''];
    return `<option value="${s}">${m[0]}(${m[1]})</option>`;
  };
  let html = '<optgroup label="' + (LANG === 'zh' ? '内置音色' : 'Built-in') + '">' + builtinSpeakers.map(mk).join('') + '</optgroup>';
  if (voiceListCache.length) {
    html += '<optgroup label="' + (LANG === 'zh' ? '我的预设(克隆)' : 'My presets (cloned)') + '">' +
      voiceListCache.map((v) => `<option value="voice:${v.voice_id}">${v.name || v.voice_id}</option>`).join('') + '</optgroup>';
  }
  sel.innerHTML = html;
  if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
  renderPreviewList();
}

/* ================= voice preview (chips with one-click playback) ================= */
let previewAudio = null;
const previewCache = new Map();
let previewState = { id: null };

function resetPreviewChips() {
  document.querySelectorAll('.pv-chip.playing').forEach((c) => c.classList.remove('playing'));
}

function renderPreviewList() {
  const wrap = $('previewList');
  if (!wrap || !builtinSpeakers.length) return;
  const chips = [
    ...builtinSpeakers.map((s) => ({ id: s, kind: 'builtin', name: ((SPEAKER_META[s] || {})[LANG] || [s])[0] })),
    ...voiceListCache.map((v) => ({ id: v.voice_id, kind: 'clone', name: v.name || v.voice_id })),
  ];
  wrap.innerHTML = chips.map((c) => `
    <button class="pv-chip${previewState.id === c.id && previewAudio && !previewAudio.paused ? ' playing' : ''}" type="button" data-id="${c.id}" data-kind="${c.kind}">
      <span class="pv-btn">
        <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.3v13.4a1 1 0 0 0 1.55.84l10.2-6.7a1 1 0 0 0 0-1.68L9.55 4.46A1 1 0 0 0 8 5.3Z"/></svg>
        <svg class="i-pause" viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1.5"/><rect x="14" y="4.5" width="4" height="15" rx="1.5"/></svg>
        <span class="spin"></span>
      </span>
      <span>${c.name}</span>
    </button>`).join('');
  wrap.querySelectorAll('.pv-chip').forEach((chip) => { chip.onclick = () => togglePreview(chip); });
}

async function togglePreview(chip) {
  const id = chip.dataset.id, kind = chip.dataset.kind;
  const btn = chip.querySelector('.pv-btn');
  if (!previewAudio) {
    previewAudio = new Audio();
    previewAudio.addEventListener('ended', () => { resetPreviewChips(); previewState = { id: null }; });
  }
  if (previewState.id === id) {
    if (previewAudio.paused) { chip.classList.add('playing'); previewAudio.play().catch(() => {}); }
    else { previewAudio.pause(); chip.classList.remove('playing'); }
    return;
  }
  resetPreviewChips();
  previewAudio.pause();
  previewState = { id };
  try {
    let src;
    if (kind === 'clone') {
      src = `${API}/clone/voice/${id}/reference`;
    } else {
      if (!previewCache.has(id)) {
        btn.classList.add('loading');
        const r = await callApi('/tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: t('preview_text'), speaker: id, language: 'auto' }),
        });
        previewCache.set(id, URL.createObjectURL(await r.blob()));
      }
      src = previewCache.get(id);
    }
    previewAudio.src = src;
    chip.classList.add('playing');
    await previewAudio.play();
  } catch (e) {
    previewState = { id: null };
    chip.classList.remove('playing');
    toast(`${t('toast_gen_fail')}: ${e.message}`);
  } finally {
    btn.classList.remove('loading');
  }
}

function rebuildLangOptions() {
  $('pLang').innerHTML = langList.map((l) =>
    `<option value="${l}">${(LANG_META[l] || {})[LANG] || l}</option>`).join('');
}

async function initOptions() {
  try {
    const j = await (await fetch(API + '/speakers')).json();
    builtinSpeakers = j.speakers;
    langList = j.languages;
    rebuildLangOptions();
    rebuildSpeakerSelect();
    await loadVoices();
  } catch (e) { toast(`${t('toast_fetch_speakers')}: ${e.message}`); }
}

/* ================= tab switching ================= */
function switchView(name) {
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('view-' + name).classList.add('active');
  if (name === 'clone') loadVoices();
  if (name === 'settings') initSettings();
}
document.querySelectorAll('.nav-item').forEach((el) => {
  el.onclick = () => switchView(el.dataset.view);
});

/* ================= preset & preset-voice synthesis ================= */
$('pBtn').onclick = async () => {
  const text = $('pText').value.trim();
  if (!text) return toast(t('toast_input_text'));
  setLoading($('pBtn'), true);
  try {
    const t0 = performance.now();
    const speakerVal = $('pSpeaker').value;
    let r;
    if (speakerVal.startsWith('voice:')) {
      if ($('pInstruct').value.trim()) toast(t('toast_instruct_ignored'));
      r = await callApi('/clone/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: speakerVal.slice(6), text, language: $('pLang').value }),
      });
    } else {
      const body = { text, speaker: speakerVal, language: $('pLang').value };
      if ($('pInstruct').value.trim()) body.instruct = $('pInstruct').value.trim();
      r = await callApi('/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    const blob = await r.blob();
    const buffer = await blob.arrayBuffer();
    $('pResult').style.display = 'block';
    showResult(blob, $('pAudio'), $('pMeta'),
      t('gen_meta', r.headers.get('X-Audio-Duration'), ((performance.now() - t0) / 1000).toFixed(1)),
      $('pSave'), buffer);
    $('pAudio').play();
  } catch (e) { toast(`${t('toast_gen_fail')}: ${e.message}`); }
  setLoading($('pBtn'), false);
};

/* ================= file pickers & recorder ================= */
function bindFilePicker(dropId, inputId, nameId, audioId, store) {
  const drop = $(dropId), input = $(inputId);
  drop.onclick = () => input.click();
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('drag'); };
  drop.ondragleave = () => drop.classList.remove('drag');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('drag'); setFile(e.dataTransfer.files[0]); };
  input.onchange = () => setFile(input.files[0]);
  function setFile(f) {
    if (!f) return;
    store.file = f;
    $(nameId).textContent = `${f.name}( ${(f.size / 1024).toFixed(0)} KB )`;
    PLAYERS[audioId].reset();
    const a = $(audioId);
    a.src = URL.createObjectURL(f);
    PLAYERS[audioId].show(true);
  }
}
const cStore = { file: null };
bindFilePicker('cDrop', 'cFile', 'cFileName', 'cRefAudio', cStore);

async function fileToBase64(file) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  return dataUrl.split(',', 2)[1];
}

async function webmToWav(blob) {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const len = audio.length, sr = audio.sampleRate, nch = audio.numberOfChannels;
    const mono = new Float32Array(len);
    for (let c = 0; c < nch; c++) {
      const d = audio.getChannelData(c);
      for (let i = 0; i < len; i++) mono[i] += d[i] / nch;
    }
    const dv = new DataView(new ArrayBuffer(44 + len * 2));
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + len * 2, true); ws(8, 'WAVE');
    ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    ws(36, 'data'); dv.setUint32(40, len * 2, true);
    for (let i = 0; i < len; i++) {
      const v = Math.max(-1, Math.min(1, mono[i]));
      dv.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    }
    return new Blob([dv.buffer], { type: 'audio/wav' });
  } finally { ctx.close(); }
}

function setupRecorder(btnId, timeId, store, nameId, audioId) {
  const btn = $(btnId), timeEl = $(timeId);
  let rec = null, stream = null, chunks = [], timer = null, discard = false;

  btn.onclick = async () => {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      toast(e.name === 'NotAllowedError' ? t('toast_mic_denied') : `${t('toast_mic_fail')}: ${e.message}`);
      return;
    }
    chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      clearInterval(timer);
      stream.getTracks().forEach((tr) => tr.stop());
      btn.classList.remove('danger');
      btn.querySelector('span').textContent = t('btn_record');
      btn.disabled = true;
      if (discard) { discard = false; timeEl.textContent = ''; btn.disabled = false; return; }
      timeEl.textContent = t('converting');
      try {
        const wavBlob = await webmToWav(new Blob(chunks, { type: rec.mimeType }));
        const stamp = new Date().toTimeString().slice(0, 8).replaceAll(':', '-');
        store.file = new File([wavBlob], `rec-${stamp}.wav`, { type: 'audio/wav' });
        $(nameId).textContent = `${store.file.name}( ${(wavBlob.size / 1024).toFixed(0)} KB )`;
        PLAYERS[audioId].reset();
        const a = $(audioId);
        a.src = URL.createObjectURL(wavBlob);
        PLAYERS[audioId].show(true);
        timeEl.textContent = t('rec_done_hint');
        toast(t('toast_rec_done'), true);
      } catch (e) {
        timeEl.textContent = '';
        toast(`${t('toast_rec_fail')}: ${e.message}`);
      }
      btn.disabled = false;
    };
    rec.start();
    btn.classList.add('danger');
    btn.querySelector('span').textContent = LANG === 'zh' ? '停止录音' : 'Stop recording';
    const t0 = Date.now();
    const upd = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      timeEl.textContent = t('rec_time', String(Math.floor(s / 60)).padStart(2, '0'), String(s % 60).padStart(2, '0'));
    };
    upd();
    timer = setInterval(upd, 500);
  };
  return { stopAndDiscard: () => { if (rec && rec.state === 'recording') { discard = true; rec.stop(); } } };
}
const cRecorder = setupRecorder('cRecBtn', 'cRecTime', cStore, 'cFileName', 'cRefAudio');

/* ================= clone ================= */
$('cBtn').onclick = async () => {
  const text = $('cText').value.trim();
  if (!text) return toast(t('toast_input_text'));
  if (!cStore.file) return toast(t('toast_pick_ref'));
  setLoading($('cBtn'), true);
  try {
    const t0 = performance.now();
    const body = { text, ref_audio: await fileToBase64(cStore.file), language: 'auto' };
    if ($('cRefText').value.trim()) body.ref_text = $('cRefText').value.trim();
    const r = await callApi('/clone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const blob = await r.blob();
    const buffer = await blob.arrayBuffer();
    $('cResult').style.display = 'block';
    showResult(blob, $('cAudio'), $('cMeta'),
      t('gen_meta', r.headers.get('X-Audio-Duration'), ((performance.now() - t0) / 1000).toFixed(1)),
      $('cSave'), buffer);
    $('cAudio').play();
  } catch (e) { toast(`${t('toast_clone_fail')}: ${e.message}`); }
  setLoading($('cBtn'), false);
};

$('cSavePresetBtn').onclick = async () => {
  if (!cStore.file) return toast(t('toast_pick_ref_mic'));
  const refText = $('cRefText').value.trim();
  if (!refText) return toast(t('toast_need_reftext'));
  setLoading($('cSavePresetBtn'), true);
  try {
    const name = $('cPresetName').value.trim() || t('unnamed');
    await callApi('/clone/voice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref_audio: await fileToBase64(cStore.file), ref_text: refText, name }),
    });
    $('cPresetHint').textContent = LANG === 'zh' ? `已存为「${name}」` : `Saved as "${name}"`;
    toast(t('toast_preset_saved'), true);
    await loadVoices();
  } catch (e) { toast(`${t('toast_preset_fail')}: ${e.message}`); }
  setLoading($('cSavePresetBtn'), false);
};

$('cClearBtn').onclick = () => {
  cRecorder.stopAndDiscard();
  cStore.file = null;
  $('cFileName').textContent = t('no_file');
  PLAYERS.cRefAudio.reset(); PLAYERS.cRefAudio.show(false);
  $('cRefText').value = ''; $('cText').value = '';
  $('cPresetName').value = ''; $('cPresetHint').textContent = ''; $('cRecTime').textContent = '';
  $('cResult').style.display = 'none';
  PLAYERS.cAudio.reset();
  toast(t('toast_cleared'), true);
};

/* ================= my voices ================= */
$('vRefresh').onclick = () => loadVoices();

async function loadVoices() {
  try {
    const j = await (await fetch(API + '/clone/voices')).json();
    voiceListCache = j.voices;
    rebuildSpeakerSelect();
    const wrap = $('vList');
    if (!j.voices.length) {
      wrap.innerHTML = emptyVoicesHTML();
      return;
    }
    wrap.innerHTML = '';
    for (const v of j.voices) {
      const row = document.createElement('div');
      row.className = 'voice-row';
      const name = v.name || v.voice_id;
      row.innerHTML = `
        <div class="avatar">${voiceprintSVG(name)}</div>
        <div class="info">
          <div class="n">${name} <span class="vid">${v.voice_id}</span></div>
          <div class="d">${LANG === 'zh' ? '注册于' : 'Registered'} ${v.created_at}${v.ref_text ? ', ' + v.ref_text : ''}</div>
        </div>
        <input type="text" placeholder="${t('input_text_ph')}" style="flex:1.2;min-width:140px" />
        <button class="btn small gen-btn">${LANG === 'zh' ? '合成' : 'Generate'}</button>
        <button class="btn ghost small icon-btn del-btn" title="${t('delete_btn')}" aria-label="${t('delete_btn')}">${TRASH_ICON}</button>
        <audio controls class="row-audio"></audio>`;
      const [input, btn, delBtn, audio] = [row.querySelector('input'), row.querySelector('.gen-btn'), row.querySelector('.del-btn'), row.querySelector('audio')];
      const disarm = () => { delBtn.dataset.armed = '0'; delBtn.innerHTML = TRASH_ICON; delBtn.classList.remove('danger'); };
      delBtn.onclick = () => {
        if (delBtn.dataset.armed !== '1') {
          delBtn.dataset.armed = '1';
          delBtn.textContent = t('confirm_delete');
          delBtn.classList.add('danger');
          setTimeout(disarm, 3000);
          return;
        }
        disarm();
        fetch(`${API}/clone/voice/${v.voice_id}`, { method: 'DELETE' })
          .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(() => { toast(t('toast_deleted'), true); loadVoices(); })
          .catch((e) => toast(`${t('toast_delete_fail')}: ${e.message}`));
      };
      btn.onclick = async () => {
        const text = input.value.trim();
        if (!text) return toast(t('toast_input_text'));
        btn.disabled = true;
        try {
          const r = await callApi('/clone/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voice_id: v.voice_id, text, language: 'auto' }),
          });
          audio.src = URL.createObjectURL(await r.blob());
          audio.style.display = 'block';
          audio.play();
        } catch (e) { toast(`${t('toast_gen_fail')}: ${e.message}`); }
        btn.disabled = false;
      };
      wrap.appendChild(row);
    }
  } catch (e) { console.error(e); }
}

/* ================= settings ================= */
let settingsLoaded = false;
let appPackaged = null;
let backendSetupRequired = false;

/* backend directory card is a developer/power-user feature: hidden in release
   builds unless the backend is unconfigured and setup is actually required */
function applyBackendCardVisibility() {
  const card = $('backendCard');
  if (card && appPackaged !== null) card.style.display = (appPackaged && !backendSetupRequired) ? 'none' : 'block';
}

async function initSettings() {
  if (!settingsLoaded) {
    $('verCurrent').textContent = await window.api.appVersion();
    settingsLoaded = true;
  }
  const s = await window.api.getSettings();
  if (document.activeElement !== $('cfgProjectDir')) $('cfgProjectDir').value = s.projectDir || '';
  if (document.activeElement !== $('cfgAudioDir')) $('cfgAudioDir').value = s.audioSaveDir || '';
  try {
    const j = await (await fetch(API + '/config')).json();
    if (document.activeElement !== $('cfgCvPath')) $('cfgCvPath').value = j.config.custom_voice_model_path || '';
    if (document.activeElement !== $('cfgClonePath')) $('cfgClonePath').value = j.config.clone_model_path || '';
    $('cfgCvId').textContent = MODEL_IDS.custom_voice + '  →  ' + j.defaults.custom_voice;
    $('cfgCloneId').textContent = MODEL_IDS.clone + '  →  ' + j.defaults.clone;
    await refreshStatus();
    // show the effective location when a model is ready but no custom path is set,
    // so the field reflects where the weights actually live instead of an empty box
    for (const [inp, key] of [['cfgCvPath', 'custom_voice'], ['cfgClonePath', 'clone']]) {
      const el = $(inp);
      if (!el.value.trim() && healthCache?.models?.[key]?.ready && healthCache.models[key].path) {
        el.value = healthCache.models[key].path;
      }
    }
    refreshModelChips();
  } catch {}
}

const MODEL_IDS = {
  custom_voice: 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
  clone: 'Qwen/Qwen3-TTS-12Hz-1.7B-Base',
};

function refreshModelChips() {
  const defs = [
    { key: 'custom_voice', chip: 'cfgCvStatus', dlRow: 'cfgCvDlRow', pathInput: 'cfgCvPath' },
    { key: 'clone', chip: 'cfgCloneStatus', dlRow: 'cfgCloneDlRow', pathInput: 'cfgClonePath' },
  ];
  for (const d of defs) {
    const chip = $(d.chip);
    if (!chip) continue;
    const info = healthCache && healthCache.models && healthCache.models[d.key];
    const el = $(d.pathInput);
    // backend readiness arrives on the 5s poll, possibly after the settings page
    // is already open — fill the effective path as soon as we learn it
    if (info && info.ready && info.path && el && !el.value.trim()) el.value = info.path;
    if (!info || !info.ready) {
      // always offer the download when the model is not ready — the server
      // downloads into the configured directory (creating it if needed)
      chip.className = 'chip missing';
      chip.textContent = t('status_missing');
      $(d.dlRow).style.display = 'flex';
    } else {
      chip.className = 'chip ready';
      chip.textContent = t('status_ready');
      $(d.dlRow).style.display = 'none';
    }
  }
}

$('langSelect').addEventListener('change', () => {
  LANG = $('langSelect').value;
  localStorage.setItem('qts-lang', LANG);
  applyLang();
});

$('cfgBrowseDir').onclick = async () => {
  const dir = await window.api.pickDirectory(t('cfg_select_dir'));
  if (dir) $('cfgProjectDir').value = dir;
};
$('cfgSaveDir').onclick = async () => {
  await window.api.saveSettings({ projectDir: $('cfgProjectDir').value.trim() });
  toast(t('toast_dir_saved'), true);
};

$('cfgBrowseAudio').onclick = async () => {
  const dir = await window.api.pickDirectory(t('cfg_select_dir'));
  if (dir) $('cfgAudioDir').value = dir;
};
$('cfgSaveAudio').onclick = async () => {
  await window.api.saveSettings({ audioSaveDir: $('cfgAudioDir').value.trim() });
  toast(t('toast_audio_saved'), true);
};

async function saveModelPaths() {
  await callApi('/config', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      custom_voice_model_path: $('cfgCvPath').value.trim(),
      clone_model_path: $('cfgClonePath').value.trim(),
    }),
  });
  toast(t('toast_model_saved'), true);
  await refreshStatus();
}
$('cfgCvPath').addEventListener('change', saveModelPaths);
$('cfgClonePath').addEventListener('change', saveModelPaths);
$('cfgCvBrowse').onclick = async () => {
  const dir = await window.api.pickDirectory(t('cfg_select_dir'));
  if (dir) { $('cfgCvPath').value = dir; saveModelPaths(); }
};
$('cfgCloneBrowse').onclick = async () => {
  const dir = await window.api.pickDirectory(t('cfg_select_dir'));
  if (dir) { $('cfgClonePath').value = dir; saveModelPaths(); }
};

/* ---- model download with progress ---- */
let pollTimer = null;
function startModelDownload(key, sourceSelId, progressId, pctId, btn) {
  setLoading(btn, true);
  callApi('/models/download', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: key, source: $(sourceSelId).value }),
  }).then(() => {
    toast(t('toast_dl_started'), true);
    $(progressId).style.display = 'block';
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      try {
        const st = await (await fetch(API + '/models/download/status')).json();
        $(progressId).firstElementChild.style.width = (st.percent || 0) + '%';
        $(pctId).textContent = `${st.percent || 0}% ${st.state === 'error' ? st.message : ''}`;
        if (st.state === 'done') {
          clearInterval(pollTimer); pollTimer = null;
          $(pctId).textContent = t('dl_complete');
          setLoading(btn, false);
          setTimeout(() => { $(progressId).style.display = 'none'; $(pctId).textContent = ''; }, 4000);
          await refreshStatus();
          toast(t('dl_complete'), true);
        } else if (st.state === 'error') {
          clearInterval(pollTimer); pollTimer = null;
          setLoading(btn, false);
          toast(`${t('toast_dl_fail')}: ${st.message}`);
        }
      } catch { /* keep polling */ }
    }, 800);
  }).catch((e) => {
    setLoading(btn, false);
    toast(`${t('toast_dl_fail')}: ${e.message}`);
  });
}
$('cfgCvDownload').onclick = (e) => startModelDownload('custom_voice', 'cfgCvSource', 'cfgCvProgress', 'cfgCvPct', e.currentTarget);
$('cfgCloneDownload').onclick = (e) => startModelDownload('clone', 'cfgCloneSource', 'cfgCloneProgress', 'cfgClonePct', e.currentTarget);

/* ================= app update ================= */
const updateBadgeText = (txt) => { $('updateBadgeText').textContent = txt; };
async function runUpdateCheck(explicit) {
  const res = await window.api.checkUpdate();
  if (res.updateAvailable) {
    $('updateBadge').classList.add('show');
    updateBadgeText(`${t('updating_badge')} · v${res.latest}`);
    $('verLatest').textContent = `→ ${LANG === 'zh' ? '最新' : 'latest'} v${res.latest}`;
    if (explicit) toast(`${t('toast_update_found')}: v${res.latest}`, true);
  } else {
    $('updateBadge').classList.remove('show');
    $('verLatest').textContent = res.error ? '' : (LANG === 'zh' ? '已是最新' : 'up to date');
    if (explicit) toast(res.error ? `${t('toast_update_check_fail')}: ${res.error}` : t('toast_up_to_date'), !res.error);
  }
  return res;
}
$('btnCheckUpdate').onclick = () => { setLoading($('btnCheckUpdate'), true); runUpdateCheck(true).finally(() => setLoading($('btnCheckUpdate'), false)); };
$('btnOpenReleases').onclick = () => window.api.openExternal(`https://github.com/${UPDATE_REPO}/releases`);

// click the badge = in-app auto update: download → swap bundle → relaunch
$('updateBadge').onclick = async () => {
  updateBadgeText(`${t('updating_progress')}…`);
  const res = await window.api.applyUpdate();
  if (res.ok) {
    updateBadgeText(t('toast_update_ready'));
  } else {
    updateBadgeText(`${t('updating_badge')}`);
    toast(`${t('toast_update_fail')}: ${res.error}`);
    if (String(res.error).includes('missing')) window.api.openExternal(`https://github.com/${UPDATE_REPO}/releases`);
  }
};
if (window.api.onUpdateProgress) {
  window.api.onUpdateProgress((pct) => updateBadgeText(`${t('updating_progress')} ${pct}%`));
}

/* ================= boot ================= */
(async () => {
  initPlayers();
  applyLang();
  window.api.appVersion().then((v) => { document.querySelector('.side-foot').textContent = 'v' + v; }).catch(() => {});
  if (window.api.isPackaged) {
    window.api.isPackaged().then((p) => { appPackaged = !!p; applyBackendCardVisibility(); }).catch(() => {});
  }
  $('pText').value = LANG === 'zh' ? '你好,欢迎使用 Qwen3-TTS 语音合成!' : 'Hello, welcome to Qwen3-TTS speech synthesis!';
  setStatus('wait', t('status_wait'));
  $('logPre').textContent = '';
  await boot();
  setInterval(refreshStatus, 5000);
  if (window.api.onUpdateAvailable) window.api.onUpdateAvailable(() => runUpdateCheck(false));
})();
