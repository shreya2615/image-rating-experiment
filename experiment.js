/****************************************************
 * IMAGE RATINGS STUDY (Resembles your previous code)
 * - Consent (buttons)
 * - Instructions (SPACE)
 * - Example (SPACE)
 * - 36 images randomized
 * - For each image: 5 pages (one question per page)
 * - Logs each page to Firebase Realtime Database
 ****************************************************/

/* ---------- Style injection (like your old script) ---------- */
var style = document.createElement("style");
style.innerHTML = `
  body { font-size: 23px !important; }
  #jspsych-progressbar-container { height: 40px !important; }
  #jspsych-progressbar { height: 40px !important; }
`;
document.head.appendChild(style);

/* ---------- Firebase (Realtime Database, compat) ---------- */
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

/* ---------- Participant ID (like your old script) ---------- */
const participantID =
  jsPsych.data.getURLVariable("id") || Math.floor(Math.random() * 1000000);

jsPsych.data.addProperties({ participantID });

/* ---------- Logging helper (like your old script) ---------- */
const logToFirebase = (trialData) => {
  const pid = jsPsych.data.get().values()[0]?.participantID || "unknown";

  // jsPsychSurveyHtmlForm stores slider responses in trialData.response
  // Example: trialData.response = { response: "5" }
  const resp = trialData.response?.response ?? "";

  const entry = {
    participantID: pid,
    modality: trialData.modality || "image",
    stimulus: trialData.stimulus || "",
    question: trialData.question || "",
    response: resp,
    rt: trialData.rt ?? "",
    timestamp: Date.now()
  };

  database.ref(`participants/${pid}/trials`).push(entry);
};

/* ---------- FILE LIST (EDIT THIS PART) ---------- */
/**
 * Option A (recommended): rename images to img01.png ... img36.png
 * and leave this as-is.
 *
 * If your images are .jpg, change ".png" to ".jpg".
 */
const imageFiles = Array.from({ length: 36 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `all_images/img${n}.png`;
});

/**
 * Example image shown on the example page
 * Put an example image at: all_images/example.png (or change this path)
 */
const exampleImage = "all_images/example.png";

/* ---------- Height slider labels ---------- */
const heightLabels = `
  <div style='display: flex; justify-content: space-between; font-size: 12px;'>
    <span>5'5"</span><span>5'6"</span><span>5'7"</span><span>5'8"</span><span>5'9"</span>
    <span>5'10"</span><span>5'11"</span><span>6'0"</span><span>6'1"</span><span>6'2"</span>
    <span>6'3"</span><span>6'4"</span><span>6'5"</span>
  </div>`;

/* ---------- CONSENT (buttons, resembles your screenshots) ---------- */
const consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h1>Informed Consent</h1>
    <div style="max-width: 900px; margin: 0 auto; text-align: left;">
      <p><b>Researchers:</b> [Your Name], [Contact Email]</p>
      <p><b>Purpose:</b> You will view images and answer brief questions about each image.</p>
      <p><b>Procedure:</b> You will rate each image on several traits and estimate height.</p>
      <p><b>Voluntary participation:</b> You can stop at any time by closing the browser tab.</p>
      <p><b>Data:</b> Your responses will be recorded for research purposes.</p>
      <p><b>Contact:</b> [Supervisor / Ethics info]</p>
      <p style="margin-top: 30px;"><i>Please select an option below.</i></p>
    </div>
  `,
  choices: ["I consent to participate", "I do NOT consent to participate"],
  on_finish: function (data) {
    data.trial_type = "consent";
    data.consented = (data.response === 0);
    // log consent choice too
    database.ref(`participants/${participantID}/meta/consent`).set({
      participantID,
      consented: data.consented,
      timestamp: Date.now()
    });
  }
};

const noConsentEnd = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>You chose not to participate.</h2>
    <p>You may now close this tab/window.</p>
  `,
  choices: "NO_KEYS"
};

/* ---------- Instructions / Example (SPACE) ---------- */
const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Instructions</h2>
    <p>You will see a series of images in a random order.</p>
    <p>For each image, you will answer <b>5 questions</b> across separate pages.</p>
    <p>Please respond as accurately as you can.</p>
    <p style="margin-top: 40px;">Press <b>SPACE</b> to view an example.</p>
  `,
  choices: [" "]
};

const exampleTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h3>Example Image Stimulus</h3>
    <p><em>Note: This image is <strong>not</strong> part of the actual experiment. It is shown here only for explanation purposes.</em></p>
    <div style="text-align: center;">
      <img src="${exampleImage}" height="250" alt="Example image">
    </div>
    <p><strong>Example question:</strong> How trustworthy does this person look?</p>
    <p><em>In the real experiment, you will answer using a 1–7 slider.</em></p>
    <p style="margin-top: 20px;"><strong>Press SPACE to begin.</strong></p>
  `,
  choices: [" "]
};

/* ---------- One image => 5 question pages (like your old makeImageBlock) ---------- */
function makeImageQuestions(facePath) {
  const sliderHtml = `
    <input type='range' name='response' min='1' max='7' step='1' style='width: 100%;'><br>
    <div style='display: flex; justify-content: space-between;'>
      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
    </div>
  `;

  const commonPreamble = (questionText) => `
    <p><em>The image may take a few seconds to load.</em></p>
    <div style="text-align:center;">
      <img src="${facePath}" height="300">
    </div>
    <p><b>${questionText}</b><br>
    <i>Please use your mouse and the slider below to make your selection.</i></p>
  `;

  return [
    {
      type: jsPsychSurveyHtmlForm,
      preamble: commonPreamble("How dominant does this individual look? (1 = Not dominant at all, 7 = Very dominant)"),
      html: sliderHtml,
      data: { modality: "image", stimulus: facePath, question: "dominant" },
      on_finish: function (data) { logToFirebase(data); }
    },
    {
      type: jsPsychSurveyHtmlForm,
      preamble: commonPreamble("How trustworthy does this individual look? (1 = Not trustworthy at all, 7 = Very trustworthy)"),
      html: sliderHtml,
      data: { modality: "image", stimulus: facePath, question: "trustworthy" },
      on_finish: function (data) { logToFirebase(data); }
    },
    {
      type: jsPsychSurveyHtmlForm,
      preamble: commonPreamble("How honest does this individual look? (1 = Not honest at all, 7 = Very honest)"),
      html: sliderHtml,
      data: { modality: "image", stimulus: facePath, question: "honest" },
      on_finish: function (data) { logToFirebase(data); }
    },
    {
      type: jsPsychSurveyHtmlForm,
      preamble: commonPreamble("How attractive does this individual look? (1 = Not attractive at all, 7 = Very attractive)"),
      html: sliderHtml,
      data: { modality: "image", stimulus: facePath, question: "attractive" },
      on_finish: function (data) { logToFirebase(data); }
    },
    {
      type: jsPsychSurveyHtmlForm,
      preamble: `
        <p><em>The image may take a few seconds to load.</em></p>
        <div style="text-align:center;">
          <img src="${facePath}" height="300">
        </div>
        <p><b>How tall do you think this person is?</b><br>
        <i>Please use your mouse and the slider below to make your selection.</i></p>
      `,
      html: `
        <input type='range' name='response' min='6' max='18' step='1' style='width: 100%;'><br>
        ${heightLabels}
      `,
      data: { modality: "image", stimulus: facePath, question: "tall" },
      on_finish: function (data) { logToFirebase(data); }
    }
  ];
}

/* ---------- Build randomized image timeline ---------- */
const randomizedImages = jsPsych.randomization.shuffle(imageFiles);

let imageTimeline = [];
randomizedImages.forEach((imgPath) => {
  imageTimeline = imageTimeline.concat(makeImageQuestions(imgPath));
});

/* ---------- End screen (optional redirect) ---------- */
const endScreen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Thank you for participating!</h2>
    <p>Your responses have been recorded.</p>
    <p>You may now close this window.</p>
  `,
  choices: "NO_KEYS",
  trial_duration: 8000
};

/* ---------- Preload ---------- */
const preload = {
  type: jsPsychPreload,
  images: [exampleImage, ...imageFiles]
};

/* ---------- Full timeline with consent branching ---------- */
let timeline = [];
timeline.push(preload);
timeline.push(consent);

// if no consent -> stop
timeline.push({
  timeline: [noConsentEnd],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === false;
  }
});

// if consent -> proceed
timeline.push({
  timeline: [instructions, exampleTrial, ...imageTimeline, endScreen],
  conditional_function: () => {
    const c = jsPsych.data.get().filter({ trial_type: "consent" }).last(1).values()[0];
    return c && c.consented === true;
  }
});

jsPsych.run(timeline);