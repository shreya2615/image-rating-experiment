/****************************************************
 * jsPsych v6 version (no initJsPsych)
 * - Consent (buttons)
 * - Instructions (SPACE)
 * - Example (SPACE)
 * - 36 images randomized
 * - 5 questions per image (one page per question)
 * - Logs each page to Firebase Realtime Database
 ****************************************************/

/* ---------- Style injection ---------- */
var style = document.createElement("style");
style.innerHTML = `
  body { font-size: 23px !important; }
  #jspsych-progressbar-container { height: 40px !important; }
  #jspsych-progressbar { height: 40px !important; }
`;
document.head.appendChild(style);

/* ---------- Firebase (Realtime Database) ---------- */
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

/* ---------- Participant ID ---------- */
const participantID =
  (typeof jsPsych !== "undefined" && jsPsych.data && jsPsych.data.getURLVariable
    ? jsPsych.data.getURLVariable("id")
    : null) || Math.floor(Math.random() * 1000000);

jsPsych.data.addProperties({ participantID });

/* ---------- Logging helper (v6 survey-html-form stores responses as JSON string) ---------- */
function logToFirebase(data) {
  let resp = "";
  try {
    // v6 survey-html-form often stores string JSON in data.responses
    if (data.responses) {
      const parsed = JSON.parse(data.responses);
      resp = parsed.response ?? "";
    } else if (data.response && typeof data.response === "object") {
      // if your plugin stores it differently
      resp = data.response.response ?? "";
    }
  } catch (e) {
    resp = "";
  }

  const entry = {
    participantID,
    modality: data.modality || "image",
    stimulus: data.stimulus || "",
    question: data.question || "",
    response: resp,
    rt: data.rt ?? "",
    timestamp: Date.now()
  };

  database.ref(`participants/${participantID}/trials`).push(entry);
}

/* ---------- EDIT THESE: your 36 image filenames ---------- */
/* Recommended: rename to img01.png ... img36.png */
const imageFiles = [];
for (let i = 1; i <= 36; i++) {
  const n = String(i).padStart(2, "0");
  imageFiles.push(`all_images/img${n}.png`); // change to .jpg if needed
}

const exampleImage = "all_images/example.png"; // change if needed

/* ---------- Height labels (for tall question) ---------- */
const heightLabels = `
  <div style='display:flex; justify-content:space-between; font-size:12px;'>
    <span>5'5"</span><span>5'6"</span><span>5'7"</span><span>5'8"</span><span>5'9"</span>
    <span>5'10"</span><span>5'11"</span><span>6'0"</span><span>6'1"</span><span>6'2"</span>
    <span>6'3"</span><span>6'4"</span><span>6'5"</span>
  </div>`;

/* ---------- Consent ---------- */
const consent = {
  type: "html-button-response",
  stimulus: `
    <h1>Informed Consent</h1>
    <div style="max-width: 900px; margin: 0 auto; text-align: left;">
      <p><b>Researchers:</b> [Your Name], [Email]</p>
      <p><b>Purpose:</b> You will view images and answer questions about them.</p>
      <p><b>Procedure:</b> You will rate each image on several traits and estimate height.</p>
      <p><b>Voluntary participation:</b> You may stop at any time by closing the tab.</p>
      <p><b>Data:</b> Your responses will be recorded for research purposes.</p>
      <p><b>Contact:</b> [Supervisor/Ethics info]</p>
      <p style="margin-top: 30px;"><i>Please choose an option:</i></p>
    </div>
  `,
  choices: ["I consent to participate", "I do NOT consent to participate"],
  on_finish: function(data) {
    const consented = (data.button_pressed === "0"); // v6 uses button_pressed as string index
    data.consented = consented;

    database.ref(`participants/${participantID}/meta/consent`).set({
      participantID,
      consented,
      timestamp: Date.now()
    });
  }
};

const noConsentEnd = {
  type: "html-keyboard-response",
  stimulus: `
    <h2>You chose not to participate.</h2>
    <p>You may now close this tab/window.</p>
  `,
  choices: jsPsych.NO_KEYS
};

/* ---------- Instructions + Example ---------- */
const instructions = {
  type: "html-keyboard-response",
  stimulus: `
    <h2>Instructions</h2>
    <p>You will see a series of images in a random order.</p>
    <p>For each image, you will answer <b>5 questions</b> (one per page).</p>
    <p style="margin-top: 40px;">Press <b>SPACE</b> to view an example.</p>
  `,
  choices: [32] // SPACE key code in v6
};

const exampleTrial = {
  type: "html-keyboard-response",
  stimulus: `
    <h3>Example Image Stimulus</h3>
    <p><em>Note: This image is <strong>not</strong> part of the actual experiment.</em></p>
    <div style="text-align:center;">
      <img src="${exampleImage}" height="250" alt="Example image">
    </div>
    <p style="margin-top: 20px;"><b>Press SPACE to begin.</b></p>
  `,
  choices: [32]
};

/* ---------- Build 5-question sequence for one image ---------- */
function makeImageQuestionTrials(facePath) {
  const sliderScale = `
    <input type='range' name='response' min='1' max='7' step='1' value='4' style='width: 100%;'><br>
    <div style='display:flex; justify-content:space-between;'>
      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
    </div>
  `;

  function trial(questionKey, questionText, html) {
    return {
      type: "survey-html-form",
      preamble: `
        <p><em>The image may take a few seconds to load.</em></p>
        <div style="text-align:center;">
          <img src="${facePath}" height="300">
        </div>
        <p><b>${questionText}</b><br>
        <i>Please use your mouse and the slider below to make your selection.</i></p>
      `,
      html: html,
      button_label: "Continue",
      data: {
        modality: "image",
        stimulus: facePath,
        question: questionKey
      },
      on_finish: function(data) {
        logToFirebase(data);
      }
    };
  }

  return [
    trial("dominant", "How dominant does this individual look? (1 = Not dominant at all, 7 = Very dominant)", sliderScale),
    trial("trustworthy", "How trustworthy does this individual look? (1 = Not trustworthy at all, 7 = Very trustworthy)", sliderScale),
    trial("honest", "How honest does this individual look? (1 = Not honest at all, 7 = Very honest)", sliderScale),
    trial("attractive", "How attractive does this individual look? (1 = Not attractive at all, 7 = Very attractive)", sliderScale),
    trial(
      "tall",
      "How tall do you think this person is?",
      `
        <input type='range' name='response' min='6' max='18' step='1' value='12' style='width: 100%;'><br>
        ${heightLabels}
      `
    )
  ];
}

/* ---------- Randomize images ---------- */
const randomizedImages = jsPsych.randomization.shuffle(imageFiles);

/* ---------- Preload ---------- */
const preload = {
  type: "preload",
  images: [exampleImage].concat(imageFiles)
};

/* ---------- Build main trials ---------- */
let imageTrials = [];
randomizedImages.forEach((imgPath) => {
  imageTrials = imageTrials.concat(makeImageQuestionTrials(imgPath));
});

/* ---------- End screen ---------- */
const endScreen = {
  type: "html-keyboard-response",
  stimulus: `
    <h2>Thank you for participating!</h2>
    <p>Your responses have been recorded.</p>
    <p>You may now close this window.</p>
  `,
  choices: jsPsych.NO_KEYS,
  trial_duration: 8000
};

/* ---------- Branching based on consent ---------- */
const proceedIfConsented = {
  timeline: [instructions, exampleTrial].concat(imageTrials).concat([endScreen]),
  conditional_function: function() {
    // check consent trial
    const consentRow = jsPsych.data.get().filter({ trial_type: "html-button-response" }).values()[0];
    // fallback: look at the last html-button-response
    const lastConsent = jsPsych.data.get().filter({ trial_type: "html-button-response" }).last(1).values()[0];
    const c = lastConsent || consentRow;
    return c && c.consented === true;
  }
};

const stopIfNotConsented = {
  timeline: [noConsentEnd],
  conditional_function: function() {
    const lastConsent = jsPsych.data.get().filter({ trial_type: "html-button-response" }).last(1).values()[0];
    return lastConsent && lastConsent.consented === false;
  }
};

/* ---------- Final timeline ---------- */
const timeline = [preload, consent, stopIfNotConsented, proceedIfConsented];

/* ---------- Start experiment (v6) ---------- */
jsPsych.init({
  timeline: timeline,
  show_progress_bar: true,
  auto_update_progress_bar: true,
  on_finish: function() {
    // optional: also save locally for backup
    // jsPsych.data.get().localSave('csv', `backup_${participantID}.csv`);
  }
});