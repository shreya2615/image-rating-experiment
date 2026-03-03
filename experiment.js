/****************************************************
 * jsPsych v7 + Firebase RTDB (compat)
 * - Consent page (scroll-to-enable buttons) matching your screenshot
 * - Instructions page
 * - Example page matching your screenshot
 * - 36 images randomized
 * - 5 questions per image (one page per question)
 * - Logs each question page to Firebase Realtime Database
 ****************************************************/

/* ---------- Global style injection (font + progress bar) ---------- */
var style = document.createElement("style");
style.innerHTML = `
  body { font-size: 23px !important; }
  #jspsych-progressbar-container { height: 40px !important; }
  #jspsych-progressbar { height: 40px !important; }
`;
document.head.appendChild(style);

/* ---------- Consent + Example styling (to match screenshots) ---------- */
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
  .ex-note { font-size: 22px; font-style: italic; margin: 0 0 26px; }
  .ex-img { display:block; margin: 0 auto 28px; height: 210px; }
  .ex-q { font-size: 24px; margin: 0 0 22px; }
  .ex-q b { font-weight: 800; }
  .ex-ital { font-size: 22px; font-style: italic; margin: 18px 0; }
  .ex-bottom { font-size: 24px; font-weight: 800; margin-top: 26px; }
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

/* ---------- Participant ID ---------- */
const participantID =
  jsPsych.data.getURLVariable("participantId") ||
  jsPsych.data.getURLVariable("id") ||
  Math.floor(Math.random() * 1000000);

jsPsych.data.addProperties({ participantID });

/* ---------- Logging helper ---------- */
const logToFirebase = (trialData) => {
  const pid = jsPsych.data.get().values()[0]?.participantID || "unknown";

  const entry = {
    participantID: pid,
    modality: trialData.modality || "image",
    stimulus: trialData.stimulus || "",
    question: trialData.question || "",
    response: trialData.response?.response ?? "",
    rt: trialData.rt ?? "",
    timestamp: Date.now()
  };

  database.ref(`participants/${pid}/trials`).push(entry);
};

/* ---------- EDIT THESE: image filenames ---------- */
/* This assumes you have: all_images/img01.png ... all_images/img36.png */
const imageFiles = Array.from({ length: 36 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `all_images/img${n}.png`; // change to .jpg if needed
});

/* Example image shown on example page */
const exampleImage = "all_images/example1.png"; // change if needed

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
          Eshnaa Aujla, graduate student (eshnaa15@yorku.ca)<br>
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

        <p><b>Questions?</b> For questions about the study, contact Dr. Vinod Goel, Eshnaa Aujla, or Shreya Sharma. For questions about your rights, contact York University's Office of Research Ethics at ore@yorku.ca.</p>

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

/* ---------- If no consent ---------- */
const noConsentEnd = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>You chose not to participate.</h2>
    <p>You may now close this tab/window.</p>
  `,
  choices: "NO_KEYS"
};

/* ---------- Instructions ---------- */
const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Instructions</h2>
    <p>You will see images in a random order.</p>
    <p>For each image, you will answer <b>5 questions</b> (one per page).</p>
    <p style="margin-top: 40px;">Press SPACE to view an example before starting.</p>
  `,
  choices: [" "]
};

/* ---------- Example page (matches your screenshot) ---------- */
const exampleTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="ex-wrap">
      <div class="ex-title">Example Image Stimulus</div>
      <div class="ex-note">Note: This image is <b>not</b> part of the actual experiment. It is shown here only for explanation purposes.</div>

      <img class="ex-img" src="${exampleImage}" alt="Example image">

      <div class="ex-q"><b>Example question:</b> How friendly does this dog look to you?</div>

      <div class="ex-ital">The image may take a few seconds to load.</div>

      <div class="ex-ital">
        In the real experiment, you will answer questions like this using a Likert scale from 1 (Not friendly at all) to 7 (Very friendly).
      </div>

      <div class="ex-bottom">Press SPACE to continue.</div>
    </div>
  `,
  choices: [" "]
};

/* ---------- One image => 5 question pages ---------- */
function makeImageQuestionTrials(facePath) {
  const sliderScale = `
    <input type='range' name='response' min='1' max='7' step='1' value='4' style='width: 100%;'><br>
    <div style='display:flex; justify-content:space-between;'>
      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
    </div>
  `;

  const common = (qText) => `
    <p><em>The image may take a few seconds to load.</em></p>
    <div style="text-align:center;">
      <img src="${facePath}" height="300" />
    </div>
    <p><b>${qText}</b><br><i>Please use your mouse and the slider below to make your selection.</i></p>
  `;

  const makeTrial = (questionKey, questionText, html) => ({
    type: jsPsychSurveyHtmlForm,
    preamble: common(questionText),
    html,
    button_label: "Continue",
    data: { modality: "image", stimulus: facePath, question: questionKey },
    on_finish: (data) => logToFirebase(data)
  });

  return [
    makeTrial(
      "dominant",
      "How dominant does this individual look? (1 = Not dominant at all, 7 = Very dominant)",
      sliderScale
    ),
    makeTrial(
      "trustworthy",
      "How trustworthy does this individual look? (1 = Not trustworthy at all, 7 = Very trustworthy)",
      sliderScale
    ),
    makeTrial(
      "honest",
      "How honest does this individual look? (1 = Not honest at all, 7 = Very honest)",
      sliderScale
    ),
    makeTrial(
      "attractive",
      "How attractive does this individual look? (1 = Not attractive at all, 7 = Very attractive)",
      sliderScale
    ),
    makeTrial(
      "tall",
      "How tall do you think this person is?",
      `
        <input type='range' name='response' min='6' max='18' step='1' value='12' style='width: 100%;'><br>
        ${heightLabels}
      `
    )
  ];
}

/* ---------- Build trials ---------- */
const randomizedImages = jsPsych.randomization.shuffle(imageFiles);
let imageTrials = [];
randomizedImages.forEach((img) => {
  imageTrials = imageTrials.concat(makeImageQuestionTrials(img));
});

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

/* ---------- Run timeline with consent branching ---------- */
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
  timeline: [instructions, exampleTrial, ...imageTrials, endScreen],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === true;
  }
});

jsPsych.run(timeline);