const video = document.getElementById("webCam");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

//turn video on or off
let renderVideo = true;

let videoLoaded = false;
let model = null;
let state = 0;

let liveVideo;
let poseNet, pose, skeleton;

let xCord;
let yCord;
let xCord2;
let yCord2;

let outline;
let button1;
let button2;
let button3;
let sButton;
let currentTime;
let interval = 0;
let saved;
let img, mask;
let timer;

let click;
let bassSynth;
let note;
let id;
let song1 = [];
let freePlay = [];
let gamestate = 0;
let mode;
let offset;
let score = 0;
let highscore = 0;

const modelParams = {
    flipHorizontal: true,
    maxNumBoxes: 2,      // max number of boxes to detect
    iouThreshold: 0.07,  // ioU threshold for non-max suppression
    scoreThreshold: 0.6, // confidence threshold for predictions
}

// Load the model.
handTrack.load(modelParams).then(lmodel => {
    // detect objects in the image.
    model = lmodel
    startVideo();
});


function startVideo() {
    handTrack.startVideo(video).then(function (status) {
        // console.log("video started", status);
        if (status) {
            state = 1;
            videoLoaded = true
            runDetection()
        } else {
            state = 2;
        }
    });
}

function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}

function modelLoaded() {
  //console.log('poseNet ready');
}

function runDetection() {
  model.detect(video).then(predictions => {
    if(predictions[0]){
      let bboxX = predictions[0].bbox[0] + predictions[0].bbox[2]/2;
      let bboxY = predictions[0].bbox[1] + predictions[0].bbox[3]/2;
      xCord = bboxX*4/3;
      yCord = bboxY*4/3;
      if(predictions[1]){
        let bboxX2 = predictions[1].bbox[0] + predictions[1].bbox[2]/2;
        let bboxY2 = predictions[1].bbox[1] + predictions[1].bbox[3]/2;
        xCord2 = bboxX2*4/3;
        yCord2 = bboxY2*4/3;
      }
      else{
        xCord2 = null;
        yCord2 = null;
      }
    }
    else{
      xCord = null;
      yCord = null;
      xCord2 = null;
      yCord2 = null;
    }
    if(renderVideo){
      model.renderPredictions(predictions, canvas, context, video);
    }
    if (videoLoaded) {
      requestAnimationFrame(runDetection);
    }
  });
}

function setup() {
  createCanvas(800, 700);
  img = loadImage('blue.jpg');
  mask = loadImage('mask2.png');
  noStroke();
  liveVideo = createCapture(VIDEO);
  liveVideo.hide();
  
  poseNet = ml5.poseNet(liveVideo, modelLoaded);
  poseNet.on('pose', gotPoses);
  
    
  sButton = createButton('Start');
  button1 = createButton('Timed');
  button2 = createButton('Free-Play');
    button1.hide();
    button2.hide();
    sButton.hide();
  //button3 = createButton('Dodge');
  
  
  bassSynth = new Tone.MembraneSynth().toMaster();
  Tone.Transport.start();
  //bassSynth.triggerAttackRelease('G4', '8n');
  song1.push (new Character(1, "G4"));
  song1.push (new Character(2, "E4"));
  song1.push (new Character(3, "C3"));
  song1.push (new Character(4, "B4"));
  
  freePlay.push (new gamestate2("C3", "white", 0));
  freePlay.push (new gamestate2("C#3", "black", 0));
  freePlay.push (new gamestate2("D3", "white", 1));
  freePlay.push (new gamestate2("D#3", "black", 1));
  freePlay.push (new gamestate2("E3", "white", 2));
  freePlay.push (new gamestate2("F3", "white", 3));
  freePlay.push (new gamestate2("Gb3", "black", 4));
  freePlay.push (new gamestate2("G3", "white", 4));
  freePlay.push (new gamestate2("G#3", "black", 5));
  freePlay.push (new gamestate2("A3", "white", 5));
  freePlay.push (new gamestate2("A#3", "black", 6));
  freePlay.push (new gamestate2("B3", "white", 6));
  
  freePlay.push (new gamestate2("C4", "white", 7));
  freePlay.push (new gamestate2("C#4", "black", 8));
  freePlay.push (new gamestate2("D4", "white", 8));
  freePlay.push (new gamestate2("D#4", "black", 9));
  freePlay.push (new gamestate2("E4", "white", 9));
  freePlay.push (new gamestate2("F4", "white", 10));
  freePlay.push (new gamestate2("Gb4", "black", 10));
  freePlay.push (new gamestate2("G4", "white", 11));
  freePlay.push (new gamestate2("G#4", "black", 11));
  freePlay.push (new gamestate2("A4", "white", 12));
  freePlay.push (new gamestate2("A#4", "black", 12));
  freePlay.push (new gamestate2("B4", "white", 13));
  //1-15 C4 C#4 D D#4 E4 F4 Gb4 G G#4 A A#4 B
}


function draw() {
if(videoLoaded == false){
  image(img, 0, 0, 945, 700);
  textFont('Montserrat');
  textStyle('normal');
  textAlign(CENTER);
  fill(255);
  textSize(40);
  if (state === 0){
    text('Loading...', 300, 380);
    textSize(25);
    text('If lost check the bottom for instructions', 400, 520);
  } else if (state === 1) {
    text('Loaded', 400, 480);
  } else if (state === 2) {
    textSize(40);
    textSize(34);
    text('Please enable video and reload', 400, 480);
    startVideo();
  }
  textAlign(LEFT);
}
  if (videoLoaded) {
  background(0);
  image(img, 0, 0, 945, 700);
  push();
  translate(width,0);
  scale(-1, 1);
  image(liveVideo, 0, 0, 800, 600);
  
  if (pose) {
    let eyeL = pose.leftEye;
    let eyeR = pose.rightEye;
    let size = (eyeL.x - eyeR.x) / 3;
    //image(mask, eyeL.x - size*1.5, eyeL.y - size*1.5, size*3, size*3);
  }
  pop();
  
  if (gamestate === 0){
    button1.class('group-select');
    button2.class('group-select');
    //button3.class('group-select');
    button1.position(0, 350);
    button2.position(0, 410);
    
    button1.show();
    button2.show();
    sButton.show();
      textAlign(RIGHT);
      textSize(18);
      fill(255);
      if (xCord != null){
        text('Move your hands to select a mode and press start', 780, 680);
      } else {
        text('Raise your hands up in the air like you just do not care!', 780, 680);
      }
      textAlign(LEFT);
    if (xCord > 0 && xCord < 260 && yCord > 350 && yCord < 410){
      mode = 'Timed';
    } else if (xCord2 > 0 && xCord2 < 260 && yCord2 > 350 && yCord2 < 410){
      mode = 'Timed';
    }
    if (xCord > 0 && xCord < 260 && yCord > 410 && yCord < 470){
      mode = 'Free-Play';
    } else if (xCord2 > 0 && xCord2 < 260 && yCord2 > 410 && yCord2 < 470){
      mode = 'Free-Play';
    }
    
    if (mode == 'Timed'){
      button1.class('group-selected');
      button2.class('group-select');
      //button3.class('group-select');
    }
    if (mode == 'Free-Play'){
      button1.class('group-select');
      button2.class('group-selected');
      //button3.class('group-select');
    }
    sButton.position(520, 200);
    if ((xCord > 520 && xCord < 700 && yCord > 200 && yCord < 230) || (xCord2 > 520 && xCord2 < 700 && yCord2 > 200 && yCord2 < 230)){
      if (mode == 'Timed'){
        currentTime = millis();
        gamestate = 1;
        button1.hide();
        button2.hide();
        sButton.hide();
      } else if (mode == 'Free-Play') {
        currentTime = millis();
        gamestate = 2;
        button1.hide();
        button2.hide();
        sButton.hide();
      }
  }
  }
  
  if (gamestate === 1){
    let timePassed = millis() - currentTime;
    for (let char of song1){
      if (timePassed > 1000){
        char.view();
        char.regenerate();
      }
    }
    if (timePassed > 2000 || timePassed < (timer*1000)){
      for (let char of song1){
      char.clicked();
    }} if (timePassed > (timer*1000)){
      gamestate = 1.5;
    }
    textFont('Montserrat');
    textStyle('normal');
    fill(255);
    textSize(25);
    text('Score: ' + score, 40, 640);
    timer = 30;
    let m = timer - (millis() - currentTime) / 1000;
    let n = m - m % 1;
    text('Time left: ' + n + ' sec', 40, 670);
    
    textAlign(RIGHT);
      textSize(18);
      fill(255);
      if (xCord != null){
        text('Eliminate as many objects as you can', 780, 680);
      } else {
        text('Raise your hands up in the air like you just do not care', 780, 680);
      }
    textAlign(LEFT);
    
    highscore = localStorage.getItem('Highest');
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('Highest', highscore);
    }
  }
  
  if (gamestate === 1.5){
    fill(0);
    textAlign(CENTER);
    textSize(25);
    text('Highscore: ' + highscore, 300, 320);
    rect(500, 400, 70, 70); //continue
    textAlign(LEFT);
  }
    
  if (gamestate === 2){
    for(let i = 0; i < 14; i++){
      fill(255);
      stroke(2);
      rect(70+i*45, 300, 30, 90);
    }
    for(let i = 0; i < 13; i++){
      if (i % 7 === 6){
      } else if (i % 7 === 2){
      } else {
        fill(0);
        rect(85+i*45, 200, 30, 90);
      }
    }
    for (let char of freePlay){
      char.clicked();
    }
  }
  
  if (gamestate === 1) {
    fill(58, 58, 170);
    offset = 0;
  } else if (gamestate === 2){
    offset = 20;
  } else {
    fill(58, 58, 170);
    offset = 0;
  }
    
  if(xCord != null && yCord != null){
    ellipse(xCord, yCord, width/15-offset);
  }
  if(xCord2 != null && yCord2 != null){
    ellipse(xCord2, yCord2, width/15-offset);
  }
  
  /*stroke('rgba(37, 182, 250, 0.5)');
  strokeWeight(50);
  noFill();
  rect(0, 0, 800, 600);*/
  //outline = rect; outline.class('group-outline');
}}

class Character {
  constructor (id, note) {
    this.s = 25;
    this.x = random(50, 550);
    this.y = random(50, 420);
    this.c = random(80, 225);
    this.id = id;
    this.alive = true;
    this.sound = note;
    if (this.alive === true){
      this.start = millis();
    } else {
      let now = this.start;
      this.start = 0;
      if ((millis() - now) < 1000) {
        fill(255);
        rect(this.x, this.y, this.s);
      }
    }
  }
  
  view () {
    fill(58, 58, this.c);
    if (this.alive === true){
      rect(this.x, this.y, this.s);
    }
  }
  
  regenerate () {
    if (millis() - this.start > 8000){
      if (this.alive === true){
        song1.push (new Character(4, "B4"));
        this.alive = false;
      }
    }
  }
  
  clicked () {
    
    if (xCord > this.x && xCord < this.x+this.s && yCord > this.y && yCord < this.y+this.s){
      if (this.alive === true){
      bassSynth.triggerAttackRelease(this.sound, '4n');
      this.alive = false;
      score += 1;
      song1.push (new Character(4, "B4"));
      }} else if (xCord2 > this.x && xCord2 < this.x+this.s && yCord2 > this.y && yCord2 < this.y+this.s){
      if (this.alive === true){
        bassSynth.triggerAttackRelease(this.sound, '4n');
      this.alive = false;
      score += 1;
      song1.push (new Character(4, "B4"));
      }}
  }
}

class gamestate2 {
  constructor (note, color, column) {
    //this.id = column;
    this.sound = note;
    if (color == "white"){
      this.x = 70+column*45;
      this.y = 300;
    }
    if (color == "black"){
      this.x = 85+column*45;
      this.y = 200;
    }
  }
  
  clicked () {
    
    if (xCord > this.x && xCord < this.x+30 && yCord > this.y && yCord < this.y+90){
      if ((millis() - interval) > 800){
      bassSynth.triggerAttackRelease(this.sound, '4n');
      interval = millis();
      }} else if (xCord2 > this.x && xCord2 < this.x+30 && yCord2 > this.y && yCord2 < this.y+90){
        if ((millis() - interval) > 800){
          bassSynth.triggerAttackRelease(this.sound, '4n');interval = millis();
      }}
  }
}
