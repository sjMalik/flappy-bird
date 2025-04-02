import './style.css'
import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 288,
  height: 512,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // No gravity
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let background;
let birdFrame = 0; // The current frame of the bird
let birdFrames = ['bird_1', 'bird_2', 'bird_3']; // The frames of the bird
let bird;
let birdDirection = 1; // The direction of the bird
let base;

function preload() {
  this.load.image('background', 'assets/background.png');
  this.load.image('bird_1', 'assets/redbird-downflap.png');
  this.load.image('bird_2', 'assets/redbird-midflap.png');
  this.load.image('bird_3', 'assets/redbird-upflap.png');
  this.load.image('base', 'assets/base.png');
  this.load.image('piller', 'assets/pipe-red.png');
}

function create() {
  // this.add.image(400, 300, 'background');
  background = this.add.tileSprite(0, 0, game.config.width, game.config.height, 'background');
  background.setScale(2); // Scale the background by 2
  background.setOrigin(0, 0); // Set the origin to the top left corner

  bird = this.add.sprite(game.config.width / 2, game.config.height / 2, 'bird_1');
  // Add mouse event to the bird
  this.input.on('pointerdown', function (pointer) {
    bird.y -= 50; // Move the bird up by 50 pixels
    birdDirection = -1; // Set the direction to up
  }
  );


  // Load the base
  let baseImage = this.textures.get('base'); // Get the base texture
  let baseHeight = baseImage.getSourceImage().height; // Get the height of the base image
  base = this.add.tileSprite(game.config.width / 2, game.config.height - baseHeight / 2, game.config.width, baseHeight, 'base');
  this.physics.add.existing(base, true); // Add physics to the base
  base.setDepth(1); // Set the depth of the base to 1

  // Create a random siz piller
  const createPiller = () => {
    let pillerHeight = Phaser.Math.Between(100, 400); // Random height between 100 and 400
    let piller = this.add.sprite(game.config.width, game.config.height - base.height, 'piller');
    piller.displayHeight = pillerHeight; // Set the height of the piller
    piller.setOrigin(0.5, 1); // Set the origin to the bottom center

    // Remove the piller when it goes out of bounds
    this.physics.add.existing(piller);
    piller.body.setVelocityX(-200); // Move the piller to the left

    piller.body.onWorldBounds = true; // Enable world bounds
    piller.body.world.on('worldbounds', function (body) {
      if (body.gameObject === piller) {
        piller.destroy(); // Destroy the piller when it goes out of bounds
      }
    }
    );
  }

  // Create a piller every 2 seconds
  this.time.addEvent({
    delay: 2000,
    callback: createPiller,
    loop: true
  });
}

function update() {
  // Update the background position to create a scrolling effect
  background.tilePositionX += 0.5; // Move the background to the right by 0.5 pixels

  // Gravity effect to make the bird fall
  bird.y += 2; // Move the bird down by 2 pixels
  if (bird.y + bird.height / 2 > game.config.height - base.height) {
    bird.y = game.config.height - base.height - bird.height / 2; // Stop the bird at the base
  }

  // Go up when the space key is pressed
  const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  if (spaceKey.isDown) {
    bird.y -= 4; // Move the bird up by 4 pixels
    birdDirection = -1; // Set the direction to up
  } else {
    birdDirection = 1; // Set the direction to down
  }

  //Animate the bird by changing the frame every 10 frames
  birdFrame += 0.1; // Increase the frame counter
  if (birdFrame >= birdFrames.length) {
    birdFrame = 0;
  }
  bird.setTexture(birdFrames[Math.floor(birdFrame)]); // Change the bird frame
}