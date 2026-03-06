/****************************************************
 * jsPsych v7 + Firebase RTDB (compat)
 * - Consent (scroll-to-enable)
 * - Demographics (one page, dropdowns)
 * - Instructions
 * - Example WITH Likert slider (must interact to continue)
 * - Two image sets (1–18, 19–36), random assignment to Block A/B
 * - Random image order within blocks
 * - Random question order within each image
 * - Block label + Image X of 18 label
 * - End-of-block screen
 * - CloudResearch ID entry near end (required)
 * - Logs to Firebase RTDB
 ****************************************************/

/* ---------- Global style injection (font + progress bar) ---------- */
var style = document.createElement("style");
style.innerHTML = `
  body { font-size: 23px !important; }
  #jspsych-progressbar-container { height: 40px !important; }
  #jspsych-progressbar { height: 40px !important; }
`;
document.head.appendChild(style);

/* ---------- Consent + Example styling + Block label + Image counter + Forms ---------- */
var consentStyle = document.createElement("style");
consentStyle.innerHTML = `
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

  .ex-wrap { max-width: 980px; margin: 0 auto; text-align: center; }
  .ex-title { font-size: 38px; font-weight: 800; margin: 26px 0 10px; }
  .ex-note { font-size: 22px; font-style: italic; margin: 0 0 22px; }
  .ex-img { display:block; margin: 0 auto 20px; height: 210px; }
  .ex-q { font-size: 24px; margin: 0 0 14px; }
  .ex-q b { font-weight: 800; }
  .ex-ital { font-size: 22px; font-style: italic; margin: 14px 0; }
  .ex-helper { font-size: 18px; font-style: italic; color: #555; margin-top: 10px; }

  .block-label {
    position: fixed;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 20px;
    color: #999;
    z-index: 9999;
    pointer-events: none;
  }

  .img-counter {
    text-align: center;
    font-size: 20px;
    color: #666;
    margin: 14px 0 10px;
    font-weight: 600;
  }

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
`;
document.head.appendChild(consentStyle);

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

/* ---------- jsPsych v7 init ---------- */
const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: true
});

/* ---------- Participant ID (internal; you will also collect CloudResearch ID later) ---------- */
const participantID =
  jsPsych.data.getURLVariable("participantId") ||
  jsPsych.data.getURLVariable("id") ||
  Math.floor(Math.random() * 1000000);

jsPsych.data.addProperties({ participantID });

/* ---------- Logging helper for stimulus trials ---------- */
const logToFirebase = (trialData) => {
  const pid = jsPsych.data.get().values()[0]?.participantID || "unknown";

  const entry = {
    participantID: pid,
    modality: trialData.modality || "image",
    block: trialData.block || "",
    block_set: trialData.block_set || "",
    image_in_block: trialData.image_in_block ?? "",
    stimulus: trialData.stimulus || "",
    question: trialData.question || "",
    response: trialData.response?.response ?? "",
    rt: trialData.rt ?? "",
    timestamp: Date.now()
  };

  database.ref(`participants/${pid}/trials`).push(entry);
};

/* ---------- Images ---------- */
/* Assumes: all_images/img01.png ... all_images/img36.png */
const imageFiles = Array.from({ length: 36 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `all_images/img${n}.png`;
});
const exampleImage = "all_images/example1.png";

/* ---------- Height labels ---------- */
const heightLabels = `
  <div style='display:flex; justify-content:space-between; font-size:12px;'>
    <span>5'5"</span><span>5'6"</span><span>5'7"</span><span>5'8"</span><span>5'9"</span>
    <span>5'10"</span><span>5'11"</span><span>6'0"</span><span>6'1"</span><span>6'2"</span>
    <span>6'3"</span><span>6'4"</span><span>6'5"</span>
  </div>`;

/* ---------- Preload ---------- */
const preload = {
  type: jsPsychPreload,
  images: [exampleImage, ...imageFiles]
};

/* ---------- Consent (scroll-to-enable) ---------- */
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

        <p><b>What You Will Be Asked to Do:</b> You will be asked to complete a self questionnaire. After viewing images or audios, you will be asked to make certain judgements.</p>

        <p><b>Risks and Discomforts:</b> We do not foresee any risks or discomfort from your participation in the research. You may, however, experience some frustration or stress if you believe that you are not doing well. Certain participants may have difficulty with some of the tasks. If you do feel discomfort you may withdraw at any time.</p>

        <p><b>Benefits:</b> There is no direct benefit to you, but knowledge may be gained that may help others in the future. The study takes approximately 20 minutes to complete, and you will receive $5.00 USD for your participation.</p>

        <p><b>Voluntary Participation:</b> Your participation is entirely voluntary and you may choose to stop participating at any time. Your decision will not affect your relationship with the researcher, study staff, or York University.</p>

        <p><b>Withdrawal:</b> You may withdraw at any time. If you withdraw, all associated data will be destroyed immediately.</p>

        <p><b>Secondary Use of Data:</b> De-identified data may be used in later related studies by the research team, but only in anonymous form and only following ethics review.</p>

        <p><b>Confidentiality:</b> All data will be collected anonymously. Data will be stored in a secure online system accessible only to the research team. Confidentiality cannot be guaranteed during internet transmission.</p>

        <p>Your data may be deposited in a publicly accessible scientific repository in fully anonymized form. No identifying information will be included.</p>

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

/* ---------- No consent ---------- */
const noConsentEnd = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<h2>You chose not to participate.</h2><p>You may now close this tab/window.</p>`,
  choices: "NO_KEYS"
};

/* ---------- Demographics (all on one page, dropdowns) ---------- */
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
        <label for="language">Primary language</label>
        <select name="language" id="language" required>
          <option value="" selected disabled>Select one</option>
          <option value="English">English</option>
          <option value="French">French</option>
          <option value="Spanish">Spanish</option>
          <option value="Other">Other</option>
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
      language: resp.language,
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
    <p> The study contains <b>2 blocks</b>  (Block A and Block B).</p>
    <p>Each block with contain a different set of images that will be randomly presented.</p>
    <p>Each block contains <b>18 images</b> 9 male images and 9 female images, for a total of <b>36 images</b>.</p>
    <p>For each image you will be required to answer 5 questions.</p>
    <p>Please view the image and answer the associated question using the scale below it.</p>
    <p style="margin-top: 40px;">Press SPACE to view an example before starting.</p>
  `,
  choices: [" "]
};

/* ---------- Example page WITH Likert slider ---------- */
const exampleTrial = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="ex-wrap">
      <div class="ex-title">Example Image Stimulus</div>
      <div class="ex-note">Note: This image is <b>not</b> part of the actual experiment. It is shown here only for explanation purposes.</div>

      <img class="ex-img" src="${exampleImage}" alt="Example image">

      <div class="ex-q"><b>Example question:</b> How friendly does this dog look to you?</div>

      <div class="ex-ital">The image may take a few seconds to load.</div>

      <div class="ex-ital">
        In the real experiment, you will answer questions like this using a Likert scale from 1 (Not friendly at all) to 7 (Very friendly).
      </div>
    </div>
  `,
  html: `
    <input type='range' name='response' min='1' max='7' step='1' value='4' style='width: 100%;'><br>
    <div style='display:flex; justify-content:space-between;'>
      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
    </div>
    <div class="ex-helper">Click or move the slider to enable Continue and begin the experiment.</div>
  `,
  button_label: "Continue",
  data: { modality: "example", question: "example_likert" },
  on_load: () => {
    const display = jsPsych.getDisplayElement();
    const btn = display.querySelector(".jspsych-btn");
    const slider = display.querySelector('input[type="range"][name="response"]');
    if (btn) btn.disabled = true;

    if (slider) {
      const enable = () => {
        if (btn) btn.disabled = false;
        slider.removeEventListener("input", enable);
        slider.removeEventListener("change", enable);
        slider.removeEventListener("pointerdown", enable);
        slider.removeEventListener("mousedown", enable);
        slider.removeEventListener("click", enable);
        slider.removeEventListener("touchstart", enable);
      };
      slider.addEventListener("input", enable);
      slider.addEventListener("change", enable);
      slider.addEventListener("pointerdown", enable);
      slider.addEventListener("mousedown", enable);
      slider.addEventListener("click", enable);
      slider.addEventListener("touchstart", enable, { passive: true });
    }
  }
};

/* ---------- Block label helper ---------- */
function blockLabelHtml(blockLabel) {
  return `<div class="block-label">Block ${blockLabel}</div>`;
}

/* ---------- Build 5 question trials, then SHUFFLE THEM per image ---------- */
function makeImageQuestionTrials(facePath, blockLabel, blockSetLabel, imageInBlock, totalImagesInBlock) {
  const sliderScale = `
    <input type='range' name='response' min='1' max='7' step='1' value='4' style='width: 100%;'><br>
    <div style='display:flex; justify-content:space-between;'>
      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
    </div>
  `;

  const common = (qText) => `
    ${blockLabelHtml(blockLabel)}
    <div class="img-counter">Image ${imageInBlock} of ${totalImagesInBlock}</div>
    <p><em>The image may take a few seconds to load.</em></p>
    <div style="text-align:center;"><img src="${facePath}" height="300" /></div>
    <p><b>${qText}</b><br><i>Please use your mouse and the slider below to make your selection.</i></p>
  `;

  const makeTrial = (questionKey, questionText, html) => ({
    type: jsPsychSurveyHtmlForm,
    preamble: common(questionText),
    html,
    button_label: "Continue",
    data: {
      modality: "image",
      stimulus: facePath,
      question: questionKey,
      block: blockLabel,
      block_set: blockSetLabel,
      image_in_block: imageInBlock
    },
    on_load: () => {
      const display = jsPsych.getDisplayElement();
      const btn = display.querySelector(".jspsych-btn");
      const slider = display.querySelector('input[type="range"][name="response"]');
      if (btn) btn.disabled = true;

      if (slider) {
        const enable = () => {
          if (btn) btn.disabled = false;
          slider.removeEventListener("input", enable);
          slider.removeEventListener("change", enable);
          slider.removeEventListener("pointerdown", enable);
          slider.removeEventListener("mousedown", enable);
          slider.removeEventListener("click", enable);
          slider.removeEventListener("touchstart", enable);
        };
        slider.addEventListener("input", enable);
        slider.addEventListener("change", enable);
        slider.addEventListener("pointerdown", enable);
        slider.addEventListener("mousedown", enable);
        slider.addEventListener("click", enable);
        slider.addEventListener("touchstart", enable, { passive: true });
      }
    },
    on_finish: (data) => logToFirebase(data)
  });

  const qTrials = [
    makeTrial("dominant", "How dominant does this individual look? (1 = Not dominant at all, 7 = Very dominant)", sliderScale),
    makeTrial("trustworthy", "How trustworthy does this individual look? (1 = Not trustworthy at all, 7 = Very trustworthy)", sliderScale),
    makeTrial("honest", "How honest does this individual look? (1 = Not honest at all, 7 = Very honest)", sliderScale),
    makeTrial("attractive", "How attractive does this individual look? (1 = Not attractive at all, 7 = Very attractive)", sliderScale),
    makeTrial("tall", "How tall do you think this person is?", `
      <input type='range' name='response' min='6' max='18' step='1' value='12' style='width: 100%;'><br>${heightLabels}
    `)
  ];

  return jsPsych.randomization.shuffle(qTrials);
}

/* ---------- Define two sets ---------- */
const set1 = imageFiles.slice(0, 18);
const set2 = imageFiles.slice(18, 36);

/* ---------- Randomly assign which set is Block A ---------- */
const blockAUsesSet1 = Math.random() < 0.5;

const blockAImages = blockAUsesSet1 ? set1 : set2;
const blockBImages = blockAUsesSet1 ? set2 : set1;

const blockASetLabel = blockAUsesSet1 ? "set_1_18" : "set_19_36";
const blockBSetLabel = blockAUsesSet1 ? "set_19_36" : "set_1_18";

/* Store assignment (will be written after consent) */
const blockAssignmentPayload = {
  participantID,
  blockA_set: blockASetLabel,
  blockB_set: blockBSetLabel,
  timestamp: Date.now()
};

/* Randomize within each block */
const shuffledA = jsPsych.randomization.shuffle(blockAImages);
const shuffledB = jsPsych.randomization.shuffle(blockBImages);

const TOTAL_PER_BLOCK = 18;

let blockATrials = [];
shuffledA.forEach((img, idx) => {
  const imageInBlock = idx + 1;
  blockATrials = blockATrials.concat(
    makeImageQuestionTrials(img, "A", blockASetLabel, imageInBlock, TOTAL_PER_BLOCK)
  );
});

let blockBTrials = [];
shuffledB.forEach((img, idx) => {
  const imageInBlock = idx + 1;
  blockBTrials = blockBTrials.concat(
    makeImageQuestionTrials(img, "B", blockBSetLabel, imageInBlock, TOTAL_PER_BLOCK)
  );
});

/* ---------- End-of-block screen (after Block A) ---------- */
const endOfBlockA = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    ${blockLabelHtml("A")}
    <div style="font-size: 24px; text-align: center; margin-top: 100px;">
      <p>End of Block A</p>
      <p>Take a short break if you need to.</p>
      <p><b>Press SPACE to continue to Block B.</b></p>
    </div>
  `,
  choices: [" "],
  data: { modality: "break", question: "end_of_block", block: "A", block_set: blockASetLabel },
  on_finish: (data) => {
    database.ref(`participants/${participantID}/trials`).push({
      participantID,
      modality: "break",
      block: "A",
      block_set: blockASetLabel,
      image_in_block: "",
      stimulus: "",
      question: "end_of_block",
      response: "",
      rt: data.rt ?? "",
      timestamp: Date.now()
    });
  }
};

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

/* ---------- Consent branching timeline ---------- */
const timeline = [];
timeline.push(preload);
timeline.push(consent);

timeline.push({
  timeline: [noConsentEnd],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === false;
  }
});

timeline.push({
  timeline: [
    demographics,

    // store block assignment AFTER consent + demographics begins
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "",
      choices: "NO_KEYS",
      trial_duration: 1,
      on_start: () => {
        database.ref(`participants/${participantID}/meta/block_assignment`).set(blockAssignmentPayload);
      }
    },

    instructions,
    exampleTrial,
    ...blockATrials,
    endOfBlockA,
    ...blockBTrials,
    cloudIdTrial,
    endScreen
  ],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === true;
  }
});

jsPsych.run(timeline);