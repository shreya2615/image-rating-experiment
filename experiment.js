/****************************************************
 * jsPsych v7 + Firebase RTDB (compat)
 * 36 images randomized
 * 5 questions per image (1 page each)
 ****************************************************/

/* ---------- Style injection ---------- */
var style = document.createElement('style');
style.innerHTML = `
  body { font-size: 23px !important; }
  #jspsych-progressbar-container { height: 40px !important; }
  #jspsych-progressbar { height: 40px !important; }
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

/* ---------- Logging helper (v7 survey-html-form returns data.response object) ---------- */
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

/* ---------- EDIT: image filenames ---------- */
const imageFiles = Array.from({ length: 36 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `all_images/img${n}.png`; // change extension if needed
});
const exampleImage = "all_images/example.png";

/* ---------- Height labels ---------- */
const heightLabels = `
  <div style='display:flex; justify-content:space-between; font-size:12px;'>
    <span>5'5"</span><span>5'6"</span><span>5'7"</span><span>5'8"</span><span>5'9"</span>
    <span>5'10"</span><span>5'11"</span><span>6'0"</span><span>6'1"</span><span>6'2"</span>
    <span>6'3"</span><span>6'4"</span><span>6'5"</span>
  </div>`;

/* ---------- Pages ---------- */
const preload = {
  type: jsPsychPreload,
  images: [exampleImage, ...imageFiles]
};

const consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h1>Informed Consent</h1>
    <div style="max-width: 900px; margin: 0 auto; text-align:left;">
      <p><b>Researchers:</b> [Your Name], [Email]</p>
      <p><b>Purpose:</b> You will view images and answer questions about them.</p>
      <p><b>Procedure:</b> You will rate each image on several traits and estimate height.</p>
      <p><b>Voluntary:</b> You can stop anytime by closing the tab.</p>
      <p><b>Data:</b> Responses are recorded for research.</p>
      <p style="margin-top: 30px;"><i>Please choose an option:</i></p>
    </div>
  `,
  choices: ["I consent to participate", "I do NOT consent to participate"],
  on_finish: (data) => {
    data.trial_type = "consent";
    data.consented = (data.response === 0);
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

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Instructions</h2>
    <p>You will see images in a random order.</p>
    <p>For each image, you will answer <b>5 questions</b> (one per page).</p>
    <p style="margin-top: 40px;">Press SPACE to view an example.</p>
  `,
  choices: [" "]
};

const exampleTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h3>Example Image Stimulus</h3>
    <p><em>This image is not part of the actual experiment.</em></p>
    <div style="text-align:center;">
      <img src="${exampleImage}" height="250" />
    </div>
    <p style="margin-top: 20px;"><b>Press SPACE to begin.</b></p>
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
    <p><b>${qText}</b><br><i>Please use your mouse and the slider below.</i></p>
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
    makeTrial("dominant", "How dominant does this individual look? (1 = Not dominant at all, 7 = Very dominant)", sliderScale),
    makeTrial("trustworthy", "How trustworthy does this individual look? (1 = Not trustworthy at all, 7 = Very trustworthy)", sliderScale),
    makeTrial("honest", "How honest does this individual look? (1 = Not honest at all, 7 = Very honest)", sliderScale),
    makeTrial("attractive", "How attractive does this individual look? (1 = Not attractive at all, 7 = Very attractive)", sliderScale),
    makeTrial("tall", "How tall do you think this person is?", `
      <input type='range' name='response' min='6' max='18' step='1' value='12' style='width: 100%;'><br>
      ${heightLabels}
    `)
  ];
}

/* ---------- Build trials ---------- */
const randomizedImages = jsPsych.randomization.shuffle(imageFiles);
let imageTrials = [];
randomizedImages.forEach((img) => { imageTrials = imageTrials.concat(makeImageQuestionTrials(img)); });

const endScreen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<h2>Thank you!</h2><p>Your responses have been recorded.</p>`,
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