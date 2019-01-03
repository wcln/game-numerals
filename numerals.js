/**
 * BCLearningNetwork.com
 * Numerals
 * Colin Bernard
 * January 2019
 */

var STAGE_WIDTH, STAGE_HEIGHT;

var questions = [];


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

  $("#numeral, #answer").css("visibility", "visible");

  stage.update();
}

function initListeners() {
  // Get the input field
  var input = document.getElementById("answer-input");

  // Execute a function when the user releases a key on the keyboard
  input.addEventListener("keyup", function(event) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Trigger the button element with a click
      document.getElementById("enter").click();
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
  $("#answer").css("display", "block");
  $("#numeral").css("display", "inline-block");
}

function endGame(){
  // Ensure all puzzle pieces have been removed.
  for (var piece of puzzlePieces) {
    stage.removeChild(piece);
  }

  $("#answer, #numeral").fadeOut(1000, "swing", function() { $("#restart").css("visibility", "visible"); }).css("display", "none");
}

function updateQuestion() {
  var currentQuestion = questions[counter];

  $("#numeral").html(currentQuestion.numeral);

  initListeners();
}

function update() {
  stage.update();
}

function check() {
  var answer = $("#answer > input").val();
  if (answer == questions[counter].answer) {
    correct();
  } else {
    incorrect();
  }
  $("#answer > input").val("");
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
