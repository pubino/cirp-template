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
      // validate required fields in the current section before advancing
      const current = document.querySelector('.form-section.active');
      if (current && !validateSection(current)) return;

      const target = btn.dataset.nav;
      showSection(target);
      if (target === 'preview') updatePreview();
    });
  });
}

/** Validate all required inputs within a section. Returns true if valid. */
function validateSection(section) {
  // clear previous validation state
  section.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  section.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
  section.querySelectorAll('.validation-banner').forEach(el => el.remove());

  const missing = [];
  section.querySelectorAll('[required]').forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('is-invalid');
      // add inline feedback message after the input
      const label = el.closest('.col-md-8, .col-md-6, .col-md-4, .col-12, .col-sm-6')
        ?.querySelector('.form-label');
      const fieldName = label
        ? label.textContent.replace(/\s*\*\s*$/, '').trim()
        : 'This field';
      const fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      fb.textContent = `${fieldName} is required.`;
      el.insertAdjacentElement('afterend', fb);
      missing.push(el);
    }
  });

  if (missing.length) {
    // insert a banner at the top of the section
    const banner = document.createElement('div');
    banner.className = 'validation-banner show';
    banner.textContent = `Please complete ${missing.length === 1 ? '1 required field' : missing.length + ' required fields'} before continuing.`;
    section.insertBefore(banner, section.firstChild);
    missing[0].focus();
    missing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

/** Clear invalid state on input. */
document.addEventListener('input', e => {
  if (e.target.classList.contains('is-invalid') && e.target.value.trim()) {
    e.target.classList.remove('is-invalid');
    // remove the adjacent feedback message
    const fb = e.target.nextElementSibling;
    if (fb && fb.classList.contains('invalid-feedback')) fb.remove();
    // remove the banner if all fields are now valid
    const section = e.target.closest('.form-section');
    if (section && !section.querySelector('.is-invalid')) {
      section.querySelectorAll('.validation-banner').forEach(el => el.remove());
    }
  }
});

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

/* ── input sanitization ────────────────────────────────────────── */

/** Strip HTML tags and characters that could inject Markdown structure or scripts. */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '')            // strip HTML angle brackets
    .replace(/javascript:/gi, '')    // strip JS protocol
    .replace(/on\w+\s*=/gi, '')      // strip inline event handlers
    .replace(/\r?\n/g, ' ');         // collapse newlines in single-line fields
}

/** Sanitize a value — recurse into arrays. */
function sanitizeValue(val) {
  if (typeof val === 'string') return sanitize(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  return val;
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
    set(data, key, sanitize(val));
  });

  // comma-separated array fields
  for (const id of ['file_sharing_systems', 'ad_group_names', 'research_computing_systems']) {
    const el = document.getElementById(id);
    if (el && el.value.trim()) {
      data[id] = el.value.split(',').map(s => sanitize(s.trim())).filter(Boolean);
    }
  }

  // special: personnel_types as array (newlines are intentional here)
  const pt = document.getElementById('personnel_types');
  if (pt && pt.value.trim()) {
    data.personnel_types = pt.value.split('\n').map(s => sanitize(s.trim())).filter(Boolean);
  }

  // abbreviation falls back to department name
  if (!data.department_abbr) {
    data.department_abbr = data.department_name || '';
  }

  // repeating: program administrators
  const admins = [];
  document.querySelectorAll('#admin-list .repeating-entry').forEach(entry => {
    const name = sanitize(entry.querySelector('.admin-name')?.value.trim() || '');
    const role = sanitize(entry.querySelector('.admin-role')?.value.trim() || '');
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
  // Escape raw HTML in the source to prevent XSS via innerHTML
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // fenced code blocks (already HTML-escaped above)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`);

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

  // links — only allow http(s) and anchor hrefs
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    if (/^https?:\/\//.test(href) || href.startsWith('#')) {
      return `<a href="${href}">${text}</a>`;
    }
    return text;
  });

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
