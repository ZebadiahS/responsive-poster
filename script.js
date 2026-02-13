let utterance = new SpeechSynthesisUtterance();
let lastMatchStates = {
  minHeight800: false,
  minHeight600: false,
  minHeight400: false,
  minWidth1000: false,
  minWidth1200: false,
  minWidth1600: false
};

function speakText(text) {
  utterance.text = text;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

//==============================================================
//✅ Main responsive logic
//==============================================================
const mainText2 = document.querySelector("#mainText2");
const mainText1 = document.querySelector("#mainText1");
const secondText1 = document.querySelector("#secondText1");

function responsivePoster() {
  const match800 = window.matchMedia("(min-height: 800px)").matches;
  const match600 = window.matchMedia("(min-height: 600px)").matches;
  const match400 = window.matchMedia("(min-height: 400px)").matches;
  const match1000 = window.matchMedia("(min-width:1000px)").matches;
  const match1200 = window.matchMedia("(min-width:1200px)").matches;
  const match1400 = window.matchMedia("(min-width:1400px)").matches;
  const match1600 = window.matchMedia("(min-width:1600px)").matches;

  // Min-height conditions
  if (match800) {
    mainText2.textContent = "4:30 pm";
    if (!lastMatchStates.minHeight800) {
      speakText("4:30 pm");
    }
  } else if (match600) {
    mainText2.textContent = "Friday";
    if (!lastMatchStates.minHeight600) {
      speakText("Friday");
    }
  } else if (match400) {
    mainText2.textContent = "Feb 27";
    if (!lastMatchStates.minHeight400) {
      speakText("February 27th");
    }
  } else { // ℹ️ Default
    mainText2.textContent = "";
  }

  // Min-width conditions
  if (match1600) {
    mainText1.textContent = "Tiri Kananuruk";
    if (!lastMatchStates.minWidth1600) {
      speakText("Tiri Kananuruk");
    }
  }
  else if (match1400) {
    mainText1.textContent = "Creative Coder";
    if (!lastMatchStates.minWidth1400) {
      speakText("Creative Coder");
    }
  }
  else if (match1200) {
    mainText1.textContent = "Designer";
    if (!lastMatchStates.minWidth1200) {
      speakText("Designer");
    }
  }
  else if (match1000) {
    mainText1.textContent = "Introducing";
    if (!lastMatchStates.minWidth1000) {
      speakText("Introducing");
    }
  }
  else { // ℹ️ Default
    mainText1.textContent = "";
  }

  // Update lastMatchStates for the next run
  lastMatchStates.minHeight800 = match800;
  lastMatchStates.minHeight600 = match600;
  lastMatchStates.minHeight400 = match400;
  lastMatchStates.minWidth1000 = match1000;
  lastMatchStates.minWidth1200 = match1200;
  lastMatchStates.minWidth1400 = match1400;
  lastMatchStates.minWidth1600 = match1600;
}

//==============================================================
//❓Initial run + resize listener
//==============================================================
responsivePoster(); // Initial run
window.addEventListener("resize", responsivePoster); // Update on resize
