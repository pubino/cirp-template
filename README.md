# CIRP Template Generator

A GitHub Pages application for generating customized **Cybersecurity Incident Response Plans** (CIRPs) for departments within Princeton University's School of Engineering and Applied Science.

**Live site:** [https://pubino.github.io/cirp-template](https://pubino.github.io/cirp-template)

## How It Works

1. **Fork this repository** to your department's GitHub organization.
2. **Edit `config.json`** to set your department's defaults — name, abbreviation, building, systems, response timelines, etc. These serve as repo-level configuration that pre-fills the form.
3. **Enable GitHub Pages** (Settings → Pages → Source: Deploy from a branch, Branch: `main`, folder: `/ (root)`).
4. **Open the deployed site** and fill in personnel details (IRL names, department chair, administrators).
5. **Export** the completed plan as Markdown (`.md`) or PDF.

## `config.json` — Repo-Level Variables

The `config.json` file contains organization-level defaults that change infrequently. When a department forks this repo, editing this file is the primary customization step. The included default reflects the ORFE department as a reference example.

Key fields:

| Field | Description |
|-------|-------------|
| `department_name` | Full department name |
| `department_abbr` | Short abbreviation used throughout the plan |
| `school_name` | School or college name |
| `location` | Building address |
| `website_url` / `intranet_url` | Department web properties |
| `ad_group_name` | Active Directory group name |
| `file_sharing_systems` | Array of file sharing platforms in use |
| `severity_response_times` | Object with `critical`, `high`, `medium`, `low` response windows |
| `training_schedule` | Object with training frequency by type |
| `maintenance_schedule` | Object with plan maintenance cadences |

## Form-Collected Fields

These are entered per session via the web form and are not stored:

- Primary and Secondary Incident Response Liaison names and titles
- Department Chair, Manager, Grants Manager
- Program Administrators (repeating field)
- Effective date and last reviewed date
- Plan author for version history

## Architecture

Static single-page app — no server, no database, no build step.

```
index.html          — Multi-step form + preview UI
css/styles.css      — Princeton-branded theme (based on pu-orfe/ug-planner)
js/app.js           — Form logic, config loading, rendering
js/template.js      — CIRP Markdown template with placeholder resolution
js/export.js        — Markdown file download + PDF generation (html2pdf.js)
config.json         — Department defaults (repo-level variables)
```

## Dependencies (CDN)

- [Bootstrap 5.3.2](https://getbootstrap.com/) — layout and base components
- [Google Fonts](https://fonts.google.com/) — Montserrat + Roboto
- [html2pdf.js 0.10.2](https://ekoopmans.github.io/html2pdf.js/) — client-side PDF generation

No npm install or build step is required.
