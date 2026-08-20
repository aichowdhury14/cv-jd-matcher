---
title: CV JD Matcher
emoji: 🧑‍💻
colorFrom: blue
colorTo: green
sdk: static
pinned: false
---

# CV ↔ Job Description Matcher

A free, live, **fully client-side** web app that matches a CV/resume
against a job description for **Data Analyst**, **Data Engineer**, and
**Data Scientist** roles. No server, no backend, no data ever leaves
your browser.

Upload a CV (PDF/DOCX/TXT) or paste its text, paste a job description
(or load a built-in sample), and get:

- An overall match score (0–100%)
- A skill-coverage score and a TF-IDF text-similarity score
- Matched skills and missing skills (skill gap analysis)
- A role-fit breakdown showing which of the three roles the CV aligns
  with best

## How it works

The app combines two signals into one score, computed in JavaScript in
the browser:

1. **Skill coverage (65% weight)** — checks which skills from a curated
   taxonomy (`skills.js`) covering Data Analyst / Data Engineer /
   Data Scientist tools, languages, and concepts appear in both the CV
   and the job description.
2. **Text similarity (35% weight)** — TF-IDF cosine similarity between
   the full CV text and job description text (custom JS implementation,
   no dependencies).

PDF parsing uses [pdf.js](https://mozilla.github.io/pdf.js/) and DOCX
parsing uses [mammoth.js](https://github.com/mwilliamson/mammoth.js),
both loaded from CDN and run entirely client-side.

## Run locally

This is a plain static site — no build step. Just serve the folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deployment (Hugging Face Spaces, free Static tier)

This repo's `README.md` already has the YAML frontmatter Hugging Face
Spaces needs (`sdk: static`). To deploy:

1. Create a free account at https://huggingface.co
2. Create a new Space → SDK: **Static** → template: **Blank** → any
   name (e.g. `cv-jd-matcher`)
3. Push this folder to the Space's git remote (shown on the Space's
   "Files" tab), or drag-and-drop the files directly in the web UI.
4. The Space serves the app instantly at
   `https://huggingface.co/spaces/<your-username>/<space-name>`.

## Project structure

```
index.html      Page structure
style.css        Styling
app.js           Matching logic + PDF/DOCX parsing + UI wiring
skills.js        Skill taxonomy per role
sample-jds.js    Example job descriptions for the demo button
```
