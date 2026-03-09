/****************************************************
 * jsPsych v7 + Firebase RTDB (compat)
 * NEW DESIGN:
 * - 6 male faces, each has 3 versions (18 total images)
 * - Each participant sees 6 images total:
 *     one version per face (counterbalanced per face)
 * - 4 Likert-style SLIDER questions on the SAME page under the image
 *     (dominance, trustworthiness, attractiveness, tall)
 * - Shows all numbers 1–7 under each slider
 * - Cannot continue unless ALL 4 sliders are actively interacted with
 *     (even if they keep the default value of 4)
 *
 * Keeps:
 * - Consent page same style (scroll-to-enable)
 * - Demographics page same dropdown style (ethnicity)
 * - CloudResearch ID page
 * - End page
 ****************************************************/

/* ---------- Global style injection (font + progress bar + compact layout) ---------- */
var style = document.createElement("style");
style.innerHTML = `
  body { font-size: 23px !important; }
  #jspsych-progressbar-container { height: 40px !important; }
  #jspsych-progressbar { height: 40px !important; }

  .consent-wrap { max-width: 980px; margin: 0 auto; text-align: center; }
  .consent-title { font-size: 44px; font-weight: 800; margin: 20px 0 6px; }
  .consent-study { font-size: 22px; font-weight: 700; margin: 0 0 18px; }
  .consent-instr { font-size: 18px; margin: 0 0 18px; color: #444; }
  .consent-box {
    margin: 0 auto;
    max-width: 860px;
    height: 420px;
    overflow-y: auto;
    border: 2px solid #d8d8d8;
    border-radius: 10px;
    padding: 18px 22px;
    text-align: left;
    background: #fff;
  }
  .consent-box p { margin: 12px 0; line-height: 1.55; }
  .consent-box b { font-weight: 800; }
  .consent-buttons { margin-top: 22px; }
  .jspsych-btn[disabled] { opacity: 0.45; cursor: not-allowed; }
  .consent-note { font-size: 18px; margin-top: 10px; color: #555; }

  .form-wrap { max-width: 900px; margin: 0 auto; text-align: left; }
  .form-title { text-align:center; font-size: 34px; font-weight: 800; margin: 18px 0 12px; }
  .form-sub { text-align:center; font-size: 18px; color: #555; margin: 0 0 18px; }
  .form-row { margin: 14px 0; }
  .form-row label { display:block; font-weight: 700; margin-bottom: 6px; }
  .form-row select, .form-row input[type="text"] {
    width: 100%;
    font-size: 18px;
    padding: 10px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .img-counter {
    text-align: center;
    font-size: 18px;
    color: #666;
    margin: 6px 0 6px;
    font-weight: 600;
  }

  .stim-wrap { max-width: 1200px; width: 95vw; margin: 0 auto; text-align: center; }
  .stim-img { height: 220px; display:block; margin: 0 auto 6px; }
  .small-note { font-style: italic; color: #555; margin: 2px 0 6px; font-size: 16px; }

  .qblock { max-width: 1200px; width: 95vw; margin: 0 auto; text-align: left; }
  .q { margin: 4px 0; padding: 6px 8px; border: 1px solid #e5e5e5; border-radius: 6px; }
  .qtitle { font-weight: 800; margin-bottom: 2px; font-size: 18px; }

  .likert-slider { margin-top: 2px; width: 100%; }
  .likert-numbers {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
    margin-top: 2px;
    padding: 0 2px;
  }
`;
document.head.appendChild(style);

/* ---------- Firebase RTDB (compat) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBcUBtwZWGn9OH0g3YQTHekrof7PoPb1EY",
  authDomain: "image-rating-experiment.firebaseapp.com",
  databaseURL: "https://image-rating-experiment-default-rtdb.firebaseio.com/",
  projectId: "image-rating-experiment",
  storageBucket: "image-rating-experiment.firebasestorage.app",
  messagingSenderId: "859746785078",
  appId: "1:859746785078:web:7c816e9e7d4b491d484597",
  measurementId: "G-ECN3E20LTZ"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/* ---------- jsPsych init ---------- */
const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: true
});

/* ---------- Participant ID ---------- */
const participantID =
  jsPsych.data.getURLVariable("participantId") ||
  jsPsych.data.getURLVariable("id") ||
  Math.floor(Math.random() * 1000000);

jsPsych.data.addProperties({ participantID });

/* ---------- Deterministic counterbalancing ----------
   For each face (1..6), pick version (1..3) based on participantID + faceIndex.
---------------------------------------------------- */
function assignedVersionForFace(faceIndex) {
  const pidNum = Number(participantID) || 0;
  return ((pidNum + faceIndex) % 3) + 1; // 1..3
}

/* ---------- IMAGE PATH (EDIT THIS if your filenames differ) ---------- */
function imagePath(faceIndex, version) {
  const f = String(faceIndex).padStart(2, "0");
  return `all_images/male_face${f}_v${version}.png`;
}

/* ---------- Build the 6 stimulus images (one per face) ---------- */
const faces = [1, 2, 3, 4, 5, 6];
const selectedStimuli = faces.map((faceIndex) => {
  const v = assignedVersionForFace(faceIndex);
  return { faceIndex, version: v, path: imagePath(faceIndex, v) };
});

// randomize order of the 6 faces for this participant
const randomizedStimuli = jsPsych.randomization.shuffle(selectedStimuli);

// store assignment in Firebase meta (audit counterbalancing)
database.ref(`participants/${participantID}/meta/version_assignment`).set({
  participantID,
  assignments: selectedStimuli,
  timestamp: Date.now()
});

/* ---------- Preload only what this participant will see ---------- */
const preload = {
  type: jsPsychPreload,
  images: randomizedStimuli.map((s) => s.path)
};

/* ---------- Consent (same style; keep your exact text here) ---------- */
const consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="consent-wrap">
      <div class="consent-title">Informed Consent</div>
      <div class="consent-study">Study Name: Cognitive Studies of Human Problem Solving and Reasoning</div>
      <div class="consent-instr">Please scroll to the bottom of the document to enable the consent buttons.</div>

      <div id="consentBox" class="consent-box">
        <p><b>Researchers:</b><br>
          Shreya Sharma, graduate student (ssharm29@york.ca)<br>
          Supervisor: Vinod Goel, vgoel@yorku.ca
        </p>

        <p>We invite you to take part in this research study. Please read this document and discuss any questions or concerns that you may have with the Investigator.</p>

        <p><b>Purpose of the Research:</b> This project investigates the cognitive structures and processes underlying human reasoning &amp; problem-solving abilities. The tasks vary between conditions but all involve attending to linguistic or visual stimuli and making a perceptual or cognitive judgment, usually on a computer screen.</p>

        <p><b>What You Will Be Asked to Do:</b> You will be asked to complete a self questionnaire. After viewing images, you will be asked to make certain judgements.</p>

        <p><b>Risks and Discomforts:</b> We do not foresee any risks or discomfort from your participation in the research. You may, however, experience some frustration or stress if you believe that you are not doing well. If you do feel discomfort you may withdraw at any time.</p>

        <p><b>Benefits:</b> There is no direct benefit to you, but knowledge may be gained that may help others in the future.</p>

        <p><b>Voluntary Participation:</b> Your participation is entirely voluntary and you may choose to stop participating at any time.</p>

        <p><b>Withdrawal:</b> You may withdraw at any time. If you withdraw, all associated data will be destroyed immediately.</p>

        <p><b>Confidentiality:</b> All data will be collected anonymously. Data will be stored in a secure online system accessible only to the research team. Confidentiality cannot be guaranteed during internet transmission.</p>

        <p><b>Questions?</b> For questions about the study, contact Dr. Vinod Goel or Shreya Sharma. For questions about your rights, contact York University's Office of Research Ethics at ore@yorku.ca.</p>

        <p><b>Legal Rights and Signatures:</b><br>
        By selecting “I consent to participate,” you indicate that you have read and understood the information above and agree to participate voluntarily.</p>
      </div>

      <div class="consent-buttons"></div>
      <div class="consent-note" id="consentNote">Scroll to the bottom to enable the buttons.</div>
    </div>
  `,
  choices: ["I consent to participate", "I do NOT consent"],
  on_load: () => {
    const buttons = Array.from(document.querySelectorAll(".jspsych-btn"));
    buttons.forEach((b) => (b.disabled = true));

    const box = document.getElementById("consentBox");
    const note = document.getElementById("consentNote");

    const enableIfBottom = () => {
      const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
      if (atBottom) {
        buttons.forEach((b) => (b.disabled = false));
        if (note) note.textContent = "";
        box.removeEventListener("scroll", enableIfBottom);
      }
    };

    box.addEventListener("scroll", enableIfBottom);
    enableIfBottom();
  },
  on_finish: (data) => {
    data.trial_type = "consent";
    data.consented = data.response === 0;

    database.ref(`participants/${participantID}/meta/consent`).set({
      participantID,
      consented: data.consented,
      timestamp: Date.now()
    });
  }
};

const noConsentEnd = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<h2>You chose not to participate.</h2><p>You may now close this tab/window.</p>`,
  choices: "NO_KEYS"
};

/* ---------- Demographics (same structure; includes ethnicity) ---------- */
const demographics = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="form-wrap">
      <div class="form-title">Demographic Questionnaire</div>
      <div class="form-sub">Please answer the following questions.</div>
    </div>
  `,
  html: `
    <div class="form-wrap">
      <div class="form-row">
        <label for="age">Age</label>
        <select name="age" id="age" required>
          <option value="" selected disabled>Select one</option>
          <option value="Under 18">Under 18</option>
          <option value="18-24">18–24</option>
          <option value="25-34">25–34</option>
          <option value="35-44">35–44</option>
          <option value="45-54">45–54</option>
          <option value="55-64">55–64</option>
          <option value="65+">65+</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div class="form-row">
        <label for="gender">Gender</label>
        <select name="gender" id="gender" required>
          <option value="" selected disabled>Select one</option>
          <option value="Woman">Woman</option>
          <option value="Man">Man</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Another identity">Another identity</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div class="form-row">
        <label for="education">Highest level of education completed</label>
        <select name="education" id="education" required>
          <option value="" selected disabled>Select one</option>
          <option value="Less than high school">Less than high school</option>
          <option value="High school diploma or equivalent">High school diploma or equivalent</option>
          <option value="Some college/university">Some college/university</option>
          <option value="College diploma">College diploma</option>
          <option value="Bachelor's degree">Bachelor's degree</option>
          <option value="Master's degree">Master's degree</option>
          <option value="Doctoral degree">Doctoral degree</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div class="form-row">
        <label for="ethnicity">Ethnicity</label>
        <select name="ethnicity" id="ethnicity" required>
          <option value="" selected disabled>Select one</option>
          <option value="Asian">Asian</option>
          <option value="Black">Black</option>
          <option value="Hispanic/Latino">Hispanic/Latino</option>
          <option value="Middle Eastern/North African">Middle Eastern/North African</option>
          <option value="Indigenous">Indigenous</option>
          <option value="White">White</option>
          <option value="Mixed/Multiracial">Mixed/Multiracial</option>
          <option value="Another ethnicity">Another ethnicity</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div class="form-row">
        <label for="country">Country of residence</label>
        <select name="country" id="country" required>
          <option value="" selected disabled>Select one</option>
          <option value="Canada">Canada</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>
    </div>
  `,
  button_label: "Continue",
  data: { modality: "demographics", question: "demographics" },
  on_finish: (data) => {
    const resp = data.response || {};
    jsPsych.data.addProperties({
      age: resp.age,
      gender: resp.gender,
      education: resp.education,
      ethnicity: resp.ethnicity,
      country: resp.country
    });

    database.ref(`participants/${participantID}/meta/demographics`).set({
      participantID,
      ...resp,
      timestamp: Date.now()
    });
  }
};

/* ---------- Instructions ---------- */
const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Instructions</h2>
    <p>You will see <b>6 images</b> (one image per face).</p>
    <p>For each image, you will answer <b>4 questions</b> on the same page.</p>
    <p>You must interact with all 4 scales before continuing.</p>
    <p style="margin-top: 30px;">Press SPACE to begin.</p>
  `,
  choices: [" "]
};

/* ---------- Single trial per image (4 Likert sliders on one page + numbers 1–7) ---------- */
function makeImageTrial(stim, imageIndex, totalImages) {
  const preamble = `
    <div class="img-counter">Image ${imageIndex} of ${totalImages}</div>
    <div class="stim-wrap">
      <div class="small-note">The image may take a few seconds to load.</div>
      <img class="stim-img" src="${stim.path}" alt="stimulus image">
    </div>
  `;

  const oneSlider = (name, title) => `
    <div class="q">
      <div class="qtitle">${title}</div>
      <input class="likert-slider" type="range" name="${name}" min="1" max="7" step="1" value="4">
      <div class="likert-numbers">
        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
      </div>
    </div>
  `;

  const html = `
    <div class="qblock">
      ${oneSlider("dominant", "How dominant does this individual look?")}
      ${oneSlider("trustworthy", "How trustworthy does this individual look?")}
      ${oneSlider("attractive", "How attractive does this individual look?")}
      ${oneSlider("tall", "How tall does this individual look?")}
    </div>
  `;

  return {
    type: jsPsychSurveyHtmlForm,
    preamble,
    html,
    button_label: "Continue",
    data: {
      modality: "image",
      face_index: stim.faceIndex,
      version: stim.version,
      stimulus: stim.path,
      image_in_task: imageIndex
    },

    on_load: () => {
      const display = jsPsych.getDisplayElement();
      const btn = display.querySelector(".jspsych-btn");
      if (btn) btn.disabled = true;

      const touched = { dominant: false, trustworthy: false, attractive: false, tall: false };
      const updateBtn = () => {
        const allDone = Object.values(touched).every(Boolean);
        if (btn) btn.disabled = !allDone;
      };

      const sliders = Array.from(display.querySelectorAll('input[type="range"]'));
      sliders.forEach((sl) => {
        const nm = sl.getAttribute("name");
        const markTouched = () => {
          if (Object.prototype.hasOwnProperty.call(touched, nm)) {
            touched[nm] = true;
            updateBtn();
          }
        };

        // Any interaction counts, even if value stays 4
        sl.addEventListener("pointerdown", markTouched);
        sl.addEventListener("mousedown", markTouched);
        sl.addEventListener("click", markTouched);
        sl.addEventListener("input", markTouched);
        sl.addEventListener("change", markTouched);
        sl.addEventListener("touchstart", markTouched, { passive: true });
      });

      updateBtn();
    },

    on_finish: (data) => {
      const resp = data.response || {};

      const entry = {
        participantID,
        modality: "image",
        face_index: stim.faceIndex,
        version: stim.version,
        stimulus: stim.path,
        image_in_task: imageIndex,
        dominant: resp.dominant ?? "",
        trustworthy: resp.trustworthy ?? "",
        attractive: resp.attractive ?? "",
        tall: resp.tall ?? "",
        rt: data.rt ?? "",
        timestamp: Date.now()
      };

      database.ref(`participants/${participantID}/trials`).push(entry);
    }
  };
}

/* ---------- Build trials (6 images total) ---------- */
const TOTAL_IMAGES = randomizedStimuli.length;
const imageTrials = randomizedStimuli.map((stim, idx) =>
  makeImageTrial(stim, idx + 1, TOTAL_IMAGES)
);

/* ---------- CloudResearch ID entry page (required) ---------- */
const cloudIdTrial = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="form-wrap">
      <div class="form-title">CloudResearch ID</div>
      <div class="form-sub">Please enter your CloudResearch Participant ID.</div>
    </div>
  `,
  html: `
    <div class="form-wrap">
      <div class="form-row">
        <label for="cloud_id">CloudResearch Participant ID</label>
        <input type="text" id="cloud_id" name="cloud_id" placeholder="Enter your ID" required />
      </div>
      <div class="form-sub" id="cloudHelp" style="text-align:left;">You must type your ID to enable Continue.</div>
    </div>
  `,
  button_label: "Continue",
  data: { modality: "meta", question: "cloudresearch_id" },
  on_load: () => {
    const display = jsPsych.getDisplayElement();
    const btn = display.querySelector(".jspsych-btn");
    const input = display.querySelector('input[name="cloud_id"]');
    const help = display.querySelector("#cloudHelp");

    if (btn) btn.disabled = true;

    const check = () => {
      const ok = input && input.value && input.value.trim().length > 0;
      if (btn) btn.disabled = !ok;
      if (help) help.style.display = ok ? "none" : "block";
    };

    if (input) {
      input.addEventListener("input", check);
      input.addEventListener("change", check);
      check();
    }
  },
  on_finish: (data) => {
    const cloudId = (data.response?.cloud_id || "").trim();
    jsPsych.data.addProperties({ cloudresearch_id: cloudId });

    database.ref(`participants/${participantID}/meta/cloudresearch_id`).set({
      participantID,
      cloudresearch_id: cloudId,
      timestamp: Date.now()
    });
  }
};

/* ---------- End screen ---------- */
const endScreen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Thank you for participating!</h2>
    <p>Your responses have been recorded.</p>
    <p>You may now close this window.</p>
  `,
  choices: "NO_KEYS",
  trial_duration: 4000
};

/* ---------- Timeline with consent branching ---------- */
const timeline = [];
timeline.push(preload);
timeline.push(consent);

timeline.push({
  timeline: [{
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<h2>You chose not to participate.</h2><p>You may now close this tab/window.</p>`,
    choices: "NO_KEYS"
  }],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === false;
  }
});

timeline.push({
  timeline: [
    demographics,
    instructions,
    ...imageTrials,
    cloudIdTrial,
    endScreen
  ],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === true;
  }
});

jsPsych.run(timeline);