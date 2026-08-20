// Core matching logic (ported from matcher.py) + file parsing + UI wiring.
// Everything runs client-side; no server, no data leaves the browser.

const STOPWORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are",
  "as","at","be","because","been","before","being","below","between","both","but",
  "by","can","could","did","do","does","doing","down","during","each","few","for",
  "from","further","had","has","have","having","he","her","here","hers","herself",
  "him","himself","his","how","in","into","is","it","its","itself","just","me",
  "more","most","my","myself","no","nor","not","of","off","on","once","only","or",
  "other","our","ours","ourselves","out","over","own","same","she","should","so",
  "some","such","than","that","the","their","theirs","them","themselves","then",
  "there","these","they","this","those","through","to","too","under","until","up",
  "very","was","we","were","what","when","where","which","while","who","whom",
  "why","will","with","you","your","yours","yourself","yourselves",
]);

function tokenize(text) {
  const matches = text.toLowerCase().match(/[a-z0-9]{2,}/g) || [];
  return matches.filter((t) => !STOPWORDS.has(t));
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

// TF-IDF cosine similarity between two documents (smooth IDF, L2-normalized),
// equivalent to sklearn's TfidfVectorizer + cosine_similarity for a 2-doc corpus.
function textSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (!tokensA.length || !tokensB.length) return 0;

  const tfA = termFreq(tokensA);
  const tfB = termFreq(tokensB);
  const vocab = new Set([...tfA.keys(), ...tfB.keys()]);
  const n = 2;

  const vecA = {};
  const vecB = {};
  for (const term of vocab) {
    const df = (tfA.has(term) ? 1 : 0) + (tfB.has(term) ? 1 : 0);
    const idf = Math.log((1 + n) / (1 + df)) + 1;
    vecA[term] = (tfA.get(term) || 0) * idf;
    vecB[term] = (tfB.get(term) || 0) * idf;
  }

  let normA = 0;
  let normB = 0;
  for (const term of vocab) {
    normA += vecA[term] ** 2;
    normB += vecB[term] ** 2;
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (!normA || !normB) return 0;

  let dot = 0;
  for (const term of vocab) {
    dot += (vecA[term] / normA) * (vecB[term] / normB);
  }
  return Math.max(0, Math.min(1, dot));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Builds a regex per skill that tolerates space/hyphen/slash variants,
// e.g. "A/B Testing" also matches "a-b testing" or "a b testing".
function skillPattern(skill) {
  const parts = skill.split(/[\s/\-]+/).map(escapeRegExp);
  const body = parts.join("[\\s\\-/]+");
  return new RegExp(`(?<![a-zA-Z0-9])${body}(?![a-zA-Z0-9])`, "i");
}

const SKILL_PATTERNS = new Map(ALL_SKILLS.map((s) => [s, skillPattern(s)]));

function extractSkills(text, skillList = ALL_SKILLS) {
  const found = new Set();
  if (!text) return found;
  for (const skill of skillList) {
    const pattern = SKILL_PATTERNS.get(skill) || skillPattern(skill);
    if (pattern.test(text)) found.add(skill);
  }
  return found;
}

const SKILL_WEIGHT = 0.65;
const TEXT_WEIGHT = 0.35;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function computeMatch(cvText, jdText) {
  const jdSkills = extractSkills(jdText);
  const cvSkills = extractSkills(cvText);

  const matched = [...jdSkills].filter((s) => cvSkills.has(s)).sort();
  const missing = [...jdSkills].filter((s) => !cvSkills.has(s)).sort();
  const extra = [...cvSkills].filter((s) => !jdSkills.has(s)).sort();

  const skillScore = jdSkills.size ? matched.length / jdSkills.size : 0;
  const simScore = textSimilarity(cvText, jdText);
  const overall = SKILL_WEIGHT * skillScore + TEXT_WEIGHT * simScore;

  return {
    overallScore: round1(overall * 100),
    skillScore: round1(skillScore * 100),
    textSimilarity: round1(simScore * 100),
    matched,
    missing,
    extra,
    jdSkillCount: jdSkills.size,
  };
}

function roleFitScores(cvText) {
  const cvSkills = extractSkills(cvText);
  const scores = {};
  for (const [role, skills] of Object.entries(ROLE_SKILLS)) {
    const roleSet = new Set(skills);
    let overlap = 0;
    for (const s of roleSet) if (cvSkills.has(s)) overlap++;
    scores[role] = roleSet.size ? round1((100 * overlap) / roleSet.size) : 0;
  }
  return scores;
}

// ---------- File parsing ----------

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) {
    return file.text();
  }
  if (name.endsWith(".pdf")) {
    return extractPdfText(file);
  }
  if (name.endsWith(".docx")) {
    return extractDocxText(file);
  }
  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text;
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

// ---------- UI wiring ----------

const cvFileInput = document.getElementById("cv-file");
const cvTextArea = document.getElementById("cv-text");
const jdTextArea = document.getElementById("jd-text");
const roleSelect = document.getElementById("role-select");
const sampleBtn = document.getElementById("sample-btn");
const matchBtn = document.getElementById("match-btn");
const fileStatus = document.getElementById("file-status");
const resultsSection = document.getElementById("results");

function populateRoleSelect() {
  for (const role of Object.keys(ROLE_SKILLS)) {
    const opt = document.createElement("option");
    opt.value = role;
    opt.textContent = role;
    roleSelect.appendChild(opt);
  }
}

cvFileInput.addEventListener("change", async () => {
  const file = cvFileInput.files[0];
  if (!file) return;
  fileStatus.textContent = "Reading file...";
  try {
    const text = await extractTextFromFile(file);
    cvTextArea.value = text.trim();
    fileStatus.textContent = `Loaded ${file.name} (${text.length} characters)`;
    fileStatus.className = "status status-ok";
  } catch (err) {
    fileStatus.textContent = `Could not read file: ${err.message}`;
    fileStatus.className = "status status-error";
  }
});

sampleBtn.addEventListener("click", () => {
  jdTextArea.value = SAMPLE_JDS[roleSelect.value];
});

function skillChips(skills, kind) {
  if (!skills.length) {
    return `<span class="muted">${kind === "missing" ? "None — great coverage!" : "None found."}</span>`;
  }
  return skills.map((s) => `<span class="chip chip-${kind}">${s}</span>`).join("");
}

function renderBar(role, pct, best) {
  return `
    <div class="bar-row">
      <div class="bar-label">${role}${role === best ? " ⭐" : ""}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="bar-value">${pct}%</div>
    </div>`;
}

function verdictBanner(score) {
  if (score >= 75) return { cls: "banner-good", text: "Strong match! This CV aligns well with the job description." };
  if (score >= 45) return { cls: "banner-mid", text: "Moderate match. Consider tailoring your CV to close some skill gaps below." };
  return { cls: "banner-low", text: "Low match. The CV and job description have limited overlap." };
}

matchBtn.addEventListener("click", () => {
  const cvText = cvTextArea.value.trim();
  const jdText = jdTextArea.value.trim();

  if (!cvText || !jdText) {
    resultsSection.innerHTML = `<div class="banner banner-mid">Please provide both a CV and a job description before matching.</div>`;
    resultsSection.hidden = false;
    return;
  }

  const result = computeMatch(cvText, jdText);
  const fit = roleFitScores(cvText);
  const bestRole = Object.entries(fit).sort((a, b) => b[1] - a[1])[0][0];
  const banner = verdictBanner(result.overallScore);

  resultsSection.innerHTML = `
    <h2>Results</h2>
    <div class="metrics">
      <div class="metric"><div class="metric-value">${result.overallScore}%</div><div class="metric-label">Overall Match Score</div></div>
      <div class="metric"><div class="metric-value">${result.skillScore}%</div><div class="metric-label">Skill Coverage</div></div>
      <div class="metric"><div class="metric-value">${result.textSimilarity}%</div><div class="metric-label">Text Similarity</div></div>
    </div>
    <div class="banner ${banner.cls}">${banner.text}</div>
    <div class="two-col">
      <div>
        <h3>✅ Matched skills</h3>
        <div class="chips">${skillChips(result.matched, "matched")}</div>
      </div>
      <div>
        <h3>⚠️ Missing skills (in JD, not in CV)</h3>
        <div class="chips">${skillChips(result.missing, "missing")}</div>
      </div>
    </div>
    <h3>Role fit breakdown</h3>
    <p class="muted">How well your CV's skills align with each of the three role profiles.</p>
    <div class="bars">
      ${Object.entries(fit).map(([role, pct]) => renderBar(role, pct, bestRole)).join("")}
    </div>
    <p class="muted">Best-aligned role based on your CV: <strong>${bestRole}</strong> (${fit[bestRole]}%)</p>
  `;
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

populateRoleSelect();
