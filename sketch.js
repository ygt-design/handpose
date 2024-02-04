let words = ["Abc", "Dinamo", "duck", "chicken", "corn", "potato"];
let images = []; // Array to store image objects
let currentContent = ""; // Variable to track the current content (word or image)
let wordsOnCanvas = [];
let currentContentWidth, currentContentHeight;
let fixed = false;
let isImageMode = false; // Variable to track whether in text or image mode
let isTextMode = false; // Variable to track whether in text mode
let currentImageIndex; // Variable to store the current image index

let handpose;
let detections = [];
let capture;
let rectangles = [];
let isDrawing = false;
let currentRect = null;
let scaleFactor = 1; // Set the scaling factor
let font;

function preload() {
  // Load your images here and add them to the images array
  images.push(loadImage("cat.png"));
  images.push(loadImage("fold.png"));
  images.push(loadImage("mickeyHand.png"));
  images.push(loadImage("hand.png"));
  images.push(loadImage("line.png"));
  images.push(loadImage("pyramid.png"));
  // Add more images as needed

  font = loadFont("HealTheWebB-Regular.otf");
}

function setup() {
  let canvas = createCanvas(640 * scaleFactor, 480 * scaleFactor);
  canvas.id("sketch");
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();

  textFont(font);

  const options = {
    flipHorizontal: true,
    maxContinuousChecks: Infinity,
    detectionConfidence: 0.3,
    scoreThreshold: 0.3,
    iouThreshold: 0.3,
  };

  handpose = ml5.handpose(capture, options, modelReady);
  colorMode(HSB);
  generateNewContent(); // Initial setup for content generation
}

function modelReady() {
  console.log("Handpose model ready!");
  handpose.on("predict", (results) => {
    detections = results;
  });
}

function draw() {
  translate(width, 0);
  scale(-1, 1);
  // image(capture, 0, 0, width, height);
  background(80);
  scale(-1, 1);
  translate(-width, 0);

  drawHandLandmarks();

  for (let i = 0; i < rectangles.length; i++) {
    let rectData = rectangles[i];

    // Set stroke color for rectangles (green stroke, no fill)
    noFill();
    stroke(120, 100, 100); // Green color for stroke

    rect(
      rectData.x,
      rectData.y,
      rectData.width * scaleFactor,
      rectData.height * scaleFactor
    );

    textAlign(CENTER, CENTER);

    push();
    // Calculate the scaling factors for width and height
    let scaleX = (rectData.width * scaleFactor) / textWidth(rectData.word);
    let scaleY = ((rectData.height * scaleFactor) / textAscent()) * -1; // Corrected scaling for height

    // Set fill color for text (black fill, no stroke)
    fill(0); // Black color for fill
    noStroke();

    scale(scaleX, scaleY);

    // Draw the text or image with the specified fill color
    if (rectData.isImage) {
      noStroke();
      // Draw the image inside the rectangle
      image(
        images[rectData.imageIndex],
        (rectData.x + (rectData.width * scaleFactor) / 32) / scaleX,
        (rectData.y + (rectData.height * scaleFactor) / 32) / scaleY,
        (rectData.width * scaleFactor) / scaleX,
        (rectData.height * scaleFactor) / scaleY
      );
    } else {
      // Draw the text
      text(
        rectData.word,
        (rectData.x + (rectData.width * scaleFactor) / 2) / scaleX,
        (rectData.y + (rectData.height * scaleFactor) / 2) / scaleY
      );
    }

    pop();
  }

  // Display the current content if it is not fixed and a hand is detected
  if (!fixed && detections.length > 0) {
    let hand = detections[0].bbox; // Get bounding box of the hand

    if (hand) {
      stroke(0);
      noFill();
      rect(hand[0], hand[1], hand[2], hand[3]);
      textAlign(CENTER, CENTER);

      push();
      let scaleX = hand[2] / currentContentWidth;
      let scaleY = hand[3] / currentContentHeight;
      scale(scaleX, scaleY);

      if (isImageMode) {
        noStroke();
        // Draw the image inside the rectangle
        image(
          images[currentImageIndex],
          (hand[0] + hand[2] / 2) / scaleX,
          (hand[1] + hand[3] / 2) / scaleY,
          (currentContentWidth * scaleFactor) / scaleX,
          (currentContentHeight * scaleFactor) / scaleY
        );
      } else {
        // Draw the text
        text(
          currentContent,
          (hand[0] + hand[2] / 2) / scaleX,
          (hand[1] + hand[3] / 2) / scaleY
        );
      }

      pop();
    }
  }

  if (isDrawing && detections.length > 0) {
    currentRect = {
      x: detections[0].landmarks[4][0] * scaleFactor,
      y: detections[0].landmarks[4][1] * scaleFactor,
      width:
        (detections[0].landmarks[8][0] - detections[0].landmarks[4][0]) *
        scaleFactor,
      height:
        (detections[0].landmarks[8][1] - detections[0].landmarks[4][1]) *
        scaleFactor,
      isImage: isImageMode,
      imageIndex: isImageMode ? currentImageIndex : undefined,
      word: currentContent, // Keep track of the content (word or image) in the rectangle
    };

    fill(0);
    stroke(120, 100, 100);
    strokeWeight(1);
    textAlign(CENTER, CENTER);
    rect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);

    push();
    // Calculate the scaling factors for width and height
    let scaleX =
      (currentRect.width * scaleFactor) / textWidth(currentRect.word);
    let scaleY = (currentRect.height * -scaleFactor) / textAscent(); // Corrected scaling for height
    scale(scaleX, scaleY);

    if (isImageMode) {
      noStroke();
      // Draw the image inside the rectangle
      image(
        images[currentRect.imageIndex],
        (currentRect.x + (currentRect.width * scaleFactor) / 32) / scaleX,
        (currentRect.y + (currentRect.height * scaleFactor) / 32) / scaleY,
        (currentRect.width * scaleFactor) / scaleX,
        (currentRect.height * scaleFactor) / scaleY
      );
    } else {
      // Draw the text
      text(
        currentRect.word,
        (currentRect.x + (currentRect.width * scaleFactor) / 2) / scaleX,
        (currentRect.y + (currentRect.height * scaleFactor) / 2) / scaleY
      );
    }

    pop();
  }
}

function drawHandLandmarks() {
  for (let i = 0; i < detections.length; i++) {
    for (let j = 0; j < detections[i].landmarks.length; j++) {
      let landmark = detections[i].landmarks[j];
      fill(120, 100, 100);
      noStroke();
      ellipse(landmark[0] * scaleFactor, landmark[1] * scaleFactor, 10, 10);
    }
  }
}

function keyPressed() {
  if (key === "a" || key === "A") {
    if (detections.length > 0) {
      isDrawing = true;
      currentRect = {
        x: detections[0].landmarks[4][0] * scaleFactor,
        y: detections[0].landmarks[4][1] * scaleFactor,
        width:
          (detections[0].landmarks[8][0] - detections[0].landmarks[4][0]) *
          scaleFactor,
        height:
          (detections[0].landmarks[8][1] - detections[0].landmarks[4][1]) *
          scaleFactor,
        isImage: isImageMode,
        imageIndex: isImageMode ? currentImageIndex : undefined,
        word: currentContent, // Keep track of the content (word or image) in the rectangle
      };
    }
  }

  if (key === "d" || key === "D") {
    if (isDrawing && currentRect) {
      isDrawing = false;
      rectangles.push({ ...currentRect });
      generateNewContent();
    }
  }

  if (key === "q" || key === "Q") {
    rectangles = [];
  }

  // Toggle between text, image, and empty rectangle on "s" keypress
  if (key === "s" || key === "S") {
    // Toggle between text, image, and empty rectangle
    if (!isImageMode && !isTextMode) {
      isImageMode = true; // Start with image mode
      isTextMode = false; // Reset text mode
      scaleFactor = 1; // Reset drawing scaling factor
    } else if (isImageMode && !isTextMode) {
      isTextMode = true; // Switch to text mode
      isImageMode = false;
      scaleFactor = 1; // Reset drawing scaling factor
    } else {
      isTextMode = false; // Switch to empty mode
      isImageMode = false;
      scaleFactor = 1; // Reset drawing scaling factor
    }

    if (isImageMode) {
      // Generate a new random image content
      currentImageIndex = floor(random(images.length));
      currentContentWidth = images[currentImageIndex].width;
      currentContentHeight = images[currentImageIndex].height;
    } else if (isTextMode) {
      // Generate a new random word content
      currentContent = random(words);
      currentContentWidth = textWidth(currentContent); // Removed padding
      currentContentHeight = 40; // Arbitrary height
    } else {
      // Empty mode, no content
      // textSize(0);
      currentContent = " ";
      currentContentWidth = 0;
      currentContentHeight = 0;
    }

    console.log(
      isImageMode ? "Image Mode" : isTextMode ? "Text Mode" : "Empty Mode"
    );
  }
}

function generateNewContent() {
  if (isImageMode) {
    // Generate a new random image content
    currentImageIndex = floor(random(images.length));
    currentContentWidth = images[currentImageIndex].width;
    currentContentHeight = images[currentImageIndex].height;
  } else {
    // Generate a new random word content
    currentContent = random(words);
    currentContentWidth = textWidth(currentContent); // Removed padding
    currentContentHeight = 40; // Arbitrary height
  }
}
