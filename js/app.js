/**
 * CIRP Template Generator — main application.
 *
 * Loads repo-level config from config.json, binds the multi-step form,
 * renders a live preview, and handles Markdown / PDF export.
 */

import { generateCIRP } from './template.js';
import { downloadMarkdown, downloadPDF } from './export.js';

/* ── state ─────────────────────────────────────────────────────── */
let config = {};          // loaded from config.json
let currentMarkdown = ''; // last generated output

/* ── bootstrap ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  prefillFromConfig();
  bindNavigation();
  bindRepeatingFields();
  bindExport();
  bindOutputTabs();
  updatePreview();          // initial render with defaults
});

/* ── config loading ────────────────────────────────────────────── */
async function loadConfig() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error(res.statusText);
    config = await res.json();
  } catch {
    console.warn('config.json not found or invalid — using empty defaults');
    config = {};
  }
}

/** Pre-fill form fields that have a matching data-config attribute. */
function prefillFromConfig() {
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.dataset.config;
    const val = resolve(config, key);
    if (val === undefined || val === null) return;

    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else if (Array.isArray(val)) {
      // textarea gets newline-separated, inputs get comma-separated
      el.value = el.tagName === 'TEXTAREA' ? val.join('\n') : val.join(', ');
    } else {
      el.value = String(val);
    }
  });
}

/** Resolve a dot-path like "severity_response_times.critical" */
function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

/* ── multi-step navigation ─────────────────────────────────────── */
function bindNavigation() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      showSection(target);
      if (target === 'preview') updatePreview();
    });
  });
}

function showSection(id) {
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');

  // update step indicators
  const steps = ['step-dept', 'step-personnel', 'step-review', 'preview'];
  const idx = steps.indexOf(id);
  document.querySelectorAll('.step-num').forEach((s, i) => {
    s.classList.toggle('done', i < idx);
  });
}

/* ── repeating personnel fields ────────────────────────────────── */
function bindRepeatingFields() {
  const addBtn = document.getElementById('add-admin');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => {
    const container = document.getElementById('admin-list');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'repeating-entry';
    div.innerHTML = `
      <button type="button" class="btn btn-pu-danger btn-remove" title="Remove">&times;</button>
      <div class="row g-2">
        <div class="col-sm-6">
          <input type="text" class="form-control form-control-sm admin-name"
                 placeholder="Name" aria-label="Administrator name">
        </div>
        <div class="col-sm-6">
          <input type="text" class="form-control form-control-sm admin-role"
                 placeholder="Role / Title" aria-label="Administrator role">
        </div>
      </div>`;
    div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
    container.appendChild(div);
  });
}

/* ── gather form data ──────────────────────────────────────────── */
function gatherFormData() {
  const data = structuredClone(config);

  // overwrite with explicit form values (non-empty only)
  document.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    let val = el.value.trim();
    if (!val) return;
    // convert date inputs to human-readable format
    if (el.type === 'date' && val) {
      const [y, m, d] = val.split('-').map(Number);
      val = new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    set(data, key, val);
  });

  // special: file_sharing_systems as array
  const fss = document.getElementById('file_sharing_systems');
  if (fss && fss.value.trim()) {
    data.file_sharing_systems = fss.value.split(',').map(s => s.trim()).filter(Boolean);
  }

  // special: personnel_types as array
  const pt = document.getElementById('personnel_types');
  if (pt && pt.value.trim()) {
    data.personnel_types = pt.value.split('\n').map(s => s.trim()).filter(Boolean);
  }

  // repeating: program administrators
  const admins = [];
  document.querySelectorAll('#admin-list .repeating-entry').forEach(entry => {
    const name = entry.querySelector('.admin-name')?.value.trim();
    const role = entry.querySelector('.admin-role')?.value.trim();
    if (name) admins.push({ name, role });
  });
  if (admins.length) data.program_administrators = admins;

  return data;
}

/** Set a dot-path value on an object, creating intermediates. */
function set(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => {
    if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
    return o[k];
  }, obj);
  target[last] = val;
}

/* ── preview rendering ─────────────────────────────────────────── */
function updatePreview() {
  const data = gatherFormData();
  currentMarkdown = generateCIRP(data);

  const previewEl = document.getElementById('preview-pane');
  const rawEl = document.getElementById('markdown-raw');

  if (previewEl) previewEl.innerHTML = renderMarkdown(currentMarkdown);
  if (rawEl) rawEl.textContent = currentMarkdown;
}

/** Minimal Markdown → HTML renderer (no external dependency). */
function renderMarkdown(md) {
  let html = md;

  // fenced code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${escapeHtml(code.trim())}</code></pre>`);

  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // tables
  html = html.replace(/^(\|.+\|)\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, (_, header, body) => {
    const ths = header.split('|').filter(Boolean).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const tds = row.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // unordered lists
  html = html.replace(/^(\s*)- (.+)$/gm, '$1<li>$2</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // ordered lists
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, '$1<li>$2</li>');

  // paragraphs — wrap loose lines
  html = html.replace(/^(?!<[a-z/])((?!$).+)$/gm, '<p>$1</p>');

  // trailing <br> from markdown line breaks
  html = html.replace(/ {2,}$/gm, '<br>');

  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── output tabs ───────────────────────────────────────────────── */
function bindOutputTabs() {
  document.querySelectorAll('.nav-pu .nav-link').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-pu .nav-link').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      document.getElementById('preview-pane').style.display = target === 'rendered' ? '' : 'none';
      document.getElementById('markdown-raw').style.display = target === 'markdown' ? '' : 'none';
    });
  });
}

/* ── export actions ────────────────────────────────────────────── */
function bindExport() {
  document.getElementById('btn-export-md')?.addEventListener('click', () => {
    if (!currentMarkdown) updatePreview();
    const abbr = gatherFormData().department_abbr || 'DEPT';
    downloadMarkdown(currentMarkdown, `CIRP-${abbr}.md`);
  });

  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    if (!currentMarkdown) updatePreview();
    const abbr = gatherFormData().department_abbr || 'DEPT';
    const el = document.getElementById('preview-pane');
    // make sure rendered view is visible for capture
    el.style.display = '';
    downloadPDF(el, `CIRP-${abbr}.pdf`);
  });

  // duplicate bottom buttons
  document.getElementById('btn-export-md-2')?.addEventListener('click', () => {
    document.getElementById('btn-export-md')?.click();
  });
  document.getElementById('btn-export-pdf-2')?.addEventListener('click', () => {
    document.getElementById('btn-export-pdf')?.click();
  });

  document.getElementById('btn-back-form')?.addEventListener('click', () => {
    showSection('step-dept');
  });
}
