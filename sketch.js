const video = document.getElementById("webCam");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

//turn video on or off
let renderVideo = true;
let videoLoaded = false;
let model = null;

let liveVideo;
let poseNet, pose, skeleton;
let xCord, yCord, xCord2, yCord2;

let button1, button2, button3;
let currentTime, startTime;
let interval = 0;
let state = 0;
let saved, timer, mode, time1;
let offset, nScore;
let speed = 0;
let img, img2, mask;

let bassSynth, note, id;
let song1 = [];
let freePlay = [];
let dodge = [];
let misses = 0;
let gamestate = 0;
let score = 0;
let highscore = 0;
let highscore2 = 0;

function restart(){
  score = 0;
  speed = 0;
  misses = 0;
  song1 = [];
  dodge = [];
  beginSong();
  mode = undefined;
}

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
            time1 = millis();
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
  textFont('Montserrat');
  textStyle('normal');
  img = loadImage('blue.jpg');
  img2 = loadImage('Hands.png');
  mask = loadImage('mask2.png');
  noStroke();
  liveVideo = createCapture(VIDEO);
  liveVideo.hide();
  
  poseNet = ml5.poseNet(liveVideo, modelLoaded);
  poseNet.on('pose', gotPoses);
  
    
  button1 = createButton('Timed');
  button2 = createButton('Piano');
  button3 = createButton('Dodge');
    button1.hide();
    button2.hide();
    button3.hide();
  bassSynth = new Tone.MembraneSynth().toMaster();
  Tone.Transport.start();
  beginSong();
  
  freePlay.push (new gamestate2("C3", "white", 0));
  freePlay.push (new gamestate2("C#3", "black", 0));
  freePlay.push (new gamestate2("D3", "white", 1));
  freePlay.push (new gamestate2("D#3", "black", 1));
  freePlay.push (new gamestate2("E3", "white", 2));
  freePlay.push (new gamestate2("F3", "white", 3));
  freePlay.push (new gamestate2("F#3", "black", 4));
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
}

function beginSong(){
  song1.push (new Character(1, "G4"));
  song1.push (new Character(2, "E4"));
  song1.push (new Character(3, "C3"));
  song1.push (new Character(4, "B4"));
}


function draw() {
if(videoLoaded == false){
  image(img, 0, 0, 1120, 700);
  textAlign(CENTER);
  fill(255);
  textSize(40);
  if (state === 0){
    text('Loading...', 400, 380);
    //textSize(25);
    //text('If lost check the bottom for instructions', 400, 420);
  } else if (state === 1) {
    text('Loaded', 400, 380);
  } else if (state === 2) {
    textSize(40);
    textSize(34);
    text('Please enable video and reload', 400, 380);
    startVideo();
  }
  textAlign(LEFT);
}
  if (videoLoaded) {
  background(0);
  image(img, 0, 0, 1120, 700);
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
    button3.class('group-select');
    button1.position(0, 350);
    button2.position(0, 410);
    button3.position(0, 470);
    
    button1.show();
    button2.show();
    button3.show();
    fill(1, 75, 114);
    rect(600, 100, 120, 50, 4);
    fill(255);
    textSize(26);
    text('Start', 636, 133);
    
    textAlign(CENTER);
    if (millis() - time1 < 10000 && (millis() % 500) < 260) {
      image(img2,147, 147, 545, 453);
      fill(37, 198, 254);
      textSize(30);
      text('Use hands as cursors',  410, 470);
    }
    
    textAlign(RIGHT);
      textSize(18);
      fill(255);
      if (xCord != null){
        text('Move your hands to select a mode and press start', 780, 680);
      }
    textAlign(LEFT);
    if (xCord > 0 && xCord < 260 && yCord > 350 && yCord < 410){ mode = 'Timed';
    } else if (xCord2 > 0 && xCord2 < 260 && yCord2 > 350 && yCord2 < 410){ mode = 'Timed';
    }
    if (xCord > 0 && xCord < 260 && yCord > 410 && yCord < 470){ mode = 'Free-Play';
    } else if (xCord2 > 0 && xCord2 < 260 && yCord2 > 410 && yCord2 < 470) { mode = 'Free-Play';
    }
    if (xCord > 0 && xCord < 260 && yCord > 470 && yCord < 530){ mode = 'Dodge';
    } else if (xCord2 > 0 && xCord2 < 260 && yCord2 > 470 && yCord2 < 530) { mode = 'Dodge';
    }
    
    if (mode == 'Timed'){
      button1.class('group-selected');
      button2.class('group-select');
      button3.class('group-select');
    } if (mode == 'Free-Play'){
      button1.class('group-select');
      button2.class('group-selected');
      button3.class('group-select');
    } if (mode == 'Dodge'){
      button1.class('group-select');
      button2.class('group-select');
      button3.class('group-selected');
    }
    if ((xCord > 600 && xCord < 720 && yCord > 100 && yCord < 150) || (xCord2 > 600 && xCord2 < 720 && yCord2 > 100 && yCord2 < 150)){
      if (mode == 'Timed'){
        currentTime = millis();
        gamestate = 1;
        button1.hide();
        button2.hide();
        button3.hide();
      } else if (mode == 'Free-Play') {
        currentTime = millis();
        gamestate = 2;
        button1.hide();
        button2.hide();
        button3.hide();
      } else if (mode == 'Dodge') {
        currentTime = millis();
        startTime = millis();
        gamestate = 3;
        button1.hide();
        button2.hide();
        button3.hide();
      } 
  }
  }
  
  if (gamestate === 1){
    nScore = 1;
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
      }
    textAlign(LEFT);

    
    highscore = localStorage.getItem('Highest');
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('Highest', highscore);
    }
  }
  
  if (gamestate === 1.5){
    fill(1, 75, 114);
    rect(600, 100, 120, 50, 4);
    rect(450, 100, 120, 50, 4);
    noStroke();
    fill(255);
    textSize(24);
    text('Back', 635, 133);
    text('Restart', 475, 133);
    
    if ((xCord > 600 && xCord < 720 && yCord > 100 && yCord < 150) || (xCord2 > 600 && xCord2 < 720 && yCord2 > 100 && yCord2 < 150)){
      currentTime = millis();
      restart();
      gamestate = 0;
    } else if ((xCord > 450 && xCord < 570 && yCord > 100 && yCord < 150) || (xCord2 > 450 && xCord2 < 570 && yCord2 > 100 && yCord2 < 150)){
      restart();
      currentTime = millis();
      if (nScore === 1){
        gamestate = 1;
      } if (nScore === 2){
        gamestate = 3;
      }
    }
    
    fill(230);
    stroke('rgba(37, 182, 250, 0.5)');
    strokeWeight(4);
    rect(40, 450, 280, 80, 3);
    noStroke();
    textAlign(CENTER);
    textSize(30);
    fill(0);
    if (nScore ===1){
    text('Highscore: ' + highscore, 180, 498);
    } if (nScore ===2){
    text('Highscore: ' + highscore2, 180, 498);
    }
    textAlign(LEFT);

  }
    
  if (gamestate === 2){
    for(let i = 0; i < 14; i++){
      fill(255);
      stroke(2);
      rect(70+i*45, 380, 43, 120);
    }
    noStroke();
    for(let i = 0; i < 13; i++){
      if (i % 7 === 6){
      } else if (i % 7 === 2){
      } else {
        fill(0);
        rect(95+i*45, 380, 35, 70);
      }
    }
    for (let char of freePlay){
      char.clicked();
    }
    if ((millis() - currentTime) > 4000){
      if ((xCord > 600 && xCord < 720 && yCord > 100 && yCord < 150) || (xCord2 > 600 && xCord2 < 720 && yCord2 > 100 && yCord2 < 150)){
      restart();
      gamestate = 0;
      }
    }
    fill(1, 75, 114);
    rect(600, 100, 120, 50, 4);
    fill(255);
    textSize(24);
    text('Back', 635, 133);
  }
  
  if (gamestate === 3) {
    nScore = 2;
    if (millis() - currentTime > (4000 - speed)) {
      dodge.push (new gamestate3());
      currentTime = millis();
    }
    
    if ((millis() - startTime) > 6000){
      if ((xCord > 600 && xCord < 720 && yCord > 100 && yCord < 150) || (xCord2 > 600 && xCord2 < 720 && yCord2 > 100 && yCord2 < 150)){
      restart();
      gamestate = 0;
      }
      fill(1, 75, 114);
      rect(600, 100, 120, 50, 4);
      fill(255);
      textSize(24);
      text('Back', 635, 133);
    }
    if (misses > 3){
      gamestate = 1.5;
    } else if (speed < 3000) {
      speed += 10;
    }
    for (let char of dodge){
      if (misses < 4){
        char.view();
        char.move();
        char.score();
      }
    }
    
    fill(255);
    textSize(25);
    text('Score: ' + score, 40, 640);

    fill(255, 0, 0);
    textSize(45);
    for (let i = 0; i < misses; i++){
      if (i < 3){
        text('X', 40 + 40*i, 690);
      }
    }
    highscore2 = localStorage.getItem('Highest2');
    if (score > highscore2) {
      highscore2 = score;
      localStorage.setItem('Highest2', highscore2);
    }
  }
  
  
  if (gamestate === 1) {
    fill(58, 58, 170);
    offset = 0;
  } else if (gamestate === 2){
    fill(58, 58, 170);
    offset = 20;
  } else {
    fill(58, 58, 170);
    offset = 0;
  }
    
  if(xCord != null && yCord != null){
    ellipse(xCord, yCord, 40-offset);
  }
  if(xCord2 != null && yCord2 != null){
    ellipse(xCord2, yCord2, 40-offset);
  }
  if (xCord != null){
  } else {
    fill(255);
    textAlign(RIGHT);
    textSize(18);
    text('Raise your hands up in the air like you just do not care!', 780, 680);
    textAlign(LEFT);
      }
  /*stroke('rgba(37, 182, 250, 0.5)');
  strokeWeight(50);
  noFill();
  rect(0, 0, 800, 600);*/
}}

class Character {
  constructor (id, note) {
    this.s = 25;
    this.x = random(50, 750);
    this.y = random(50, 530);
    this.c = random(80, 225);
    this.id = id;
    this.alive = true;
    this.sound = note;
  }
  
  view () {
    fill(58, 58, this.c);
    if (this.alive === true){
      rect(this.x, this.y, this.s);
      this.start = millis();
    } else {
      let now = this.start;
      this.start = 0;
      if ((millis() - now) < 3000) {
        fill(255);
        rect(this.x-10, this.y-10, this.s+20);
      }
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
    this.c = color;
    if (color == "white"){
      this.x = 70+column*45;
      this.y = 380;
    }
    if (color == "black"){
      this.x = 95+column*45;
      this.y = 380;
    }
  }
  
  clicked () {
    
    if ((xCord > this.x && xCord < this.x+43 && yCord > this.y && yCord < this.y+120) || (xCord2 > this.x && xCord2 < this.x+43 && yCord2 > this.y && yCord2 < this.y+120)){
      if ((millis() - interval) > 800) {
        if (this.c == "black"){
          if ((xCord > this.x && xCord < this.x+35 && yCord > this.y && yCord < this.y+70) || (xCord2 > this.x && xCord2 < this.x+35 && yCord2 > this.y && yCord2 < this.y+70)){
        bassSynth.triggerAttackRelease(this.sound, '4n');
        interval = millis();
        }}
        else if (this.c == "white"){
          bassSynth.triggerAttackRelease(this.sound, '4n');
          interval = millis();
        }
      }}
  }
}

class gamestate3 {
  constructor () {
    this.x = random(25, 775);
    this.w = random(30, 100);
    this.h = random(30, 100);
    this.alive = true;
    this.y = 0 - this.h;
  }
  
  view () {
    if (this.alive === true){
      fill(34, 149, 199);
      rect(this.x, this.y, this.h, this.w);
    }
  }
  move () {
    if (this.alive){
      this.y += 20;
    }
    if (this.y + this.h > 570){
      this.alive = false;
    }
  }
  score(){
  if ((xCord > this.x && xCord < this.x+this.w && yCord > this.y && yCord < this.y+this.h) || (xCord2 > this.x && xCord2 < this.x+this.w && yCord2 > this.y && yCord2 < this.y+this.h)){
    if ((millis() - interval) > 800) {
      misses += 1;
      bassSynth.triggerAttackRelease("B3", '4n');
      interval = millis();
    }
  } else {
    if (xCord != null && xCord2 != null){
    score += 1;
    textAlign(RIGHT);
    textSize(18);
    fill(255);
    text('Dodge falling objects', 780, 680);
    textAlign(LEFT);
  }}
  }
}