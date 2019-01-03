/**
 * BCLearningNetwork.com
 * Place Value
 * Colin Bernard
 * November 2018
 */

var STAGE_WIDTH, STAGE_HEIGHT;

var questions = [

];

var placeValues = ["Ones", "Tens", "Hundreds", "Thousands", "Ten Thousands", "Hundred Thousands", "Millions", "Ten Millions", "Hundred Millions", "Billions"]
var decimalPlaceValues = ["Tenths", "Hundredths", "Thousandths", "Ten-thousandths", "Hundred-thousandths", "Millionths"];

var counter = 0;
var removedPieces = [];

/*
 * Initialize the stage and some createJS settings
 */
function init() {
    STAGE_WIDTH = parseInt(document.getElementById("gameCanvas").getAttribute("width"));
    STAGE_HEIGHT = parseInt(document.getElementById("gameCanvas").getAttribute("height"));

    // Init stage object.
    stage = new createjs.Stage("gameCanvas");
    stage.mouseEventsEnabled = true;
    stage.enableMouseOver(); // Default, checks the mouse 20 times/second for hovering cursor changes

    // Load questions.
    var url = new URL(window.location.href);
    var version = url.searchParams.get("version");
    $.getJSON("versions/" + version + ".json", (data) => {
      questions = shuffle(data);
    });

    setupManifest(); // preloadJS
    startPreload();

    initListeners();

    stage.update();
}


/*
 * Place graphics and add them to the stage.
 */
function initGraphics() {

  initRandomBackground();

  // Add puzzle pieces to the stage.
  for (var piece of puzzlePieces) {
    stage.addChild(piece);
  }

  // Load first question.
  updateQuestion();

  $("#number, #place-value").css("visibility", "visible");

  stage.update();
}

function initListeners() {
  $(".digit").unbind('click').click(function() {
    if (this.id === "correct") {
      correct();
    } else {
      incorrect();
    }
  });
}

function initRandomBackground() {
  stage.removeChild(background);
  background = null;
  var randomImage = new Image();
  randomImage.src = "https://source.unsplash.com/460x360/?nature?" + new Date().getTime();
  randomImage.onload = (event) => {
    var image = event.target;
    background = new createjs.Bitmap(image);
    stage.addChildAt(background, 0);
  }
}

function correct() {
  counter++;
  createjs.Sound.play("correct");
  // Remove a random puzzle piece.
  let index = Math.floor(Math.random() * puzzlePieces.length);
  createjs.Tween.get(puzzlePieces[index]).to({alpha: 0}, 100).call(function() {
    stage.removeChild(puzzlePieces[index]);
    removedPieces.push(puzzlePieces[index]);
    puzzlePieces.splice(index, 1);
    if (puzzlePieces.length === 0 || counter === questions.length) {
      endGame();
    } else {
      updateQuestion();
    }
  });
}

function incorrect() {
  createjs.Sound.play("incorrect");
}

function start() {

}

function restart() {
  counter = 0;
  updateQuestion();
  initRandomBackground();

  for (var piece of removedPieces) {
    puzzlePieces.push(piece);
  }
  removedPieces = [];
  for (var piece of puzzlePieces) {
    piece.alpha = 1;
    stage.addChild(piece);
  }

  $("#restart").css("visibility", "hidden");
  $("#place-value").css("display", "block");
  $("#number").css("display", "inline-block");
}

function endGame(){
  // Ensure all puzzle pieces have been removed.
  for (var piece of puzzlePieces) {
    stage.removeChild(piece);
  }

  $("#place-value, #number").fadeOut(1000, "swing", function() { $("#restart").css("visibility", "visible"); }).css("display", "none");
}

function updateQuestion() {
  var currentQuestion = questions[counter];

  var numberHTML = "";

  var correctIndex = -1; // ?

  var numberString = currentQuestion.number.toString();

  // Determine correct answer index based on place value string.
  if (numberString.includes('.')) {
    if (decimalPlaceValues.includes(currentQuestion.placeValue)) {
      let placeValueIndex = decimalPlaceValues.indexOf(currentQuestion.placeValue);
      correctIndex = numberString.indexOf('.') + 1 + placeValueIndex;
    } else if (placeValues.includes(currentQuestion.placeValue)) {
      let placeValueIndex = placeValues.indexOf(currentQuestion.placeValue);
      correctIndex = numberString.indexOf('.') - 1 - placeValueIndex;
    } else {
      alert("Invalid place value supplied.");
    }
  } else {
    if (placeValues.includes(currentQuestion.placeValue)) {
      let placeValueIndex = placeValues.indexOf(currentQuestion.placeValue);
      correctIndex = numberString.length - 1 - placeValueIndex;
    } else {
      alert("Invalid place value supplied.");
    }
  }

  // Load HTML number div.
  var characters = numberWithSpaces(currentQuestion.number).split("");
  var spaceOffset = 0;
  for (var i = 0; i < characters.length; i++) {
    if ('0123456789'.indexOf(characters[i]) !== -1) {
      if (i - spaceOffset === correctIndex) {
        numberHTML += '<span class="digit" id="correct">' + characters[i] + '</span>';

      } else {
        numberHTML += '<span class="digit">' + characters[i] + '</span>';
      }

    } else {

      if (characters[i] === ' ') {
        spaceOffset++;
      }

      numberHTML += characters[i];
    }
  }



  $("#number").html(numberHTML);
  $("#place-value > p").html(currentQuestion.placeValue);

  initListeners();
}

function update() {
  stage.update();
}

//////////////////////// PRELOADJS FUNCTIONS
var puzzlePieces = [];
var background;

/*
 * Add files to be loaded here.
 */
function setupManifest() {
  manifest = [
    {
      src: "sounds/correct.mp3",
      id: "correct"
    },
    {
      src: "sounds/wrong.mp3",
      id: "incorrect"
    }
  ];

  // Load puzzle pieces into manifest.
  for (var i = 1; i <= 20; i++) {
    manifest.push({src: "images/puzzle_pieces/" + i + ".png", id: "piece_" + i});
  }
}


function startPreload() {
    preload = new createjs.LoadQueue(true);
    preload.installPlugin(createjs.Sound);
    preload.on("fileload", handleFileLoad);
    preload.on("progress", handleFileProgress);
    preload.on("complete", loadComplete);
    preload.on("error", loadError);
    preload.loadManifest(manifest);
}

/*
 * Specify how to load each file.
 */
function handleFileLoad(event) {
    console.log("A file has loaded of type: " + event.item.type);
    // create bitmaps of images
    if (event.item.id.includes("piece")) {
      puzzlePieces.push(new createjs.Bitmap(event.result));
    }
}

function loadError(evt) {
    console.log("Error!", evt.text);
}

// not currently used as load time is short
function handleFileProgress(event) {

}

/*
 * Displays the start screen.
 */
function loadComplete(event) {
    console.log("Finished Loading Assets");

    // ticker calls update function, set the FPS
    createjs.Ticker.setFPS(24);
    createjs.Ticker.addEventListener("tick", update); // call update function

    stage.update();
    initGraphics();
}

///////////////////////////////////// END PRELOADJS FUNCTIONS

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

const numberWithSpaces = (x) => {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
}
