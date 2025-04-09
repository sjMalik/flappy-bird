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
let gameStart = false; // Flag to check if the game has started
let gameOver = false; // Flag to check if the game is over

function preload() {
  this.load.image('background', 'assets/background.png');
  this.load.image('bird_1', 'assets/redbird-downflap.png');
  this.load.image('bird_2', 'assets/redbird-midflap.png');
  this.load.image('bird_3', 'assets/redbird-upflap.png');
  this.load.image('base', 'assets/base.png');
  this.load.image('piller', 'assets/pipe-red.png');
  this.load.image('startGame', 'assets/start_game.png');
  this.load.image('gameOver', 'assets/label_game_over.png');
  this.load.image('resumeButton', 'assets/button_resume.png');
}

function create() {
  // this.add.image(400, 300, 'background');
  background = this.add.tileSprite(0, 0, game.config.width, game.config.height, 'background');
  background.setScale(2); // Scale the background by 2
  background.setOrigin(0, 0); // Set the origin to the top left corner

  // Add the start game image
  let startGameImage = this.add.image(game.config.width / 2, game.config.height / 2, 'startGame');
  startGameImage.setOrigin(0.5, 0.5); // Set the origin to the center
  startGameImage.setInteractive(); // Make the image interactive
  startGameImage.on('pointerdown', () => {
    startGameImage.destroy(); // Destroy the start game image when clicked
    bird.setVisible(true); // Show the bird
    gameStart = true; // Set the game start flag to true

    // Create a piller every 2 seconds
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        if (gameOver) {
          return; // If the game is over, don't create more pillers
        }
        createPiller(); // Call the createPiller function
      },
      loop: true
    });
  })

  bird = this.physics.add.sprite(game.config.width / 2, game.config.height / 2, 'bird_1'); // Create the bird sprite
  bird.setVisible(false); // Hide the bird initially


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

    // Add collision detection between the bird and the piller
    this.physics.add.overlap(bird, piller, hanleCollision, null, this);
  }

  // Handle collision between the bird and the piller
  const hanleCollision = () => {
    gameOver = true; // Set the game over flag to true
    bird.setTint(0xff0000); // Set the tint to red
    bird.setVelocity(0, 0); // Stop the bird
    bird.body.setGravityY(0); // Stop the gravity
    this.physics.pause(); // Pause the physics

    // Show the game over image
    let gameOverImage = this.add.image(game.config.width / 2, game.config.height / 2, 'gameOver');
    gameOverImage.setOrigin(0.5, 0.5); // Set the origin to the center
    gameOverImage.setScale(2);

    // Add the resume button
    let resumeButton = this.add.image(game.config.width / 2, game.config.height - 100, 'resumeButton');
    resumeButton.setOrigin(0.5, 2); // Set the origin to the center
    resumeButton.setScale(3); // Scale the button
    resumeButton.setInteractive(); // Make the button interactive

    resumeButton.on('pointerdown', () => {
      resumeButton.destroy(); // Destroy the resume button when clicked
      gameOverImage.destroy(); // Destroy the game over image
      resumeGame(); // Call the resume game function
    }
    );
    // 
  }

  // Add collision detection between the bird and the base
  this.physics.add.collider(bird, base, hanleCollision, null, this); // Handle collision with the base

  bird.body.onWorldBounds = true; // Enable world bounds
  this.physics.world.on('worldbounds', function (body) {
    if (body.gameObject === bird) {
      handleCollision(); // Call the collision handler if the bird goes out of bounds
    }
  }
  );

  const resumeGame = () => {
    gameStart = false; // Set the game start flag to false
    gameOver = false; // Set the game over flag to false
    bird.setActive(false);
    this.scene.restart(); // Restart the scene
  }
}

function update() {
  if (!gameStart || gameOver) {
    // If the game hasn't started or is over, don't update the game
    return; // Don't update if the game hasn't started
  }
  // Update the background position to create a scrolling effect
  background.tilePositionX += 0.5; // Move the background to the right by 0.5 pixels

  if (bird.active) {
    // apply gravity-like effect
    bird.body.setVelocityY(bird.body.velocity.y + 10); // Set the vertical velocity of the bird
    // prevent bird from falling below the base
    let baseTop = game.config.height - base.height; // Get the top position of the base
    if (bird.y + bird.height / 2 > baseTop) {
      bird.y = baseTop - bird.height / 2; // Set the bird's position to the top of the base
      bird.body.setVelocityY(0); // Stop the bird's vertical velocity
    }

    // Go up when the space key is pressed
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    if (spaceKey.isDown || this.input.activePointer.isDown) {
      bird.body.setVelocityY(-200); // Move the bird up
      birdDirection = -1; // Set the direction to up
    }

    //Animate the bird by changing the frame every 10 frames
    birdFrame += 0.1; // Increase the frame counter
    if (birdFrame >= birdFrames.length) {
      birdFrame = 0;
    }
    bird.setTexture(birdFrames[Math.floor(birdFrame)]); // Change the bird frame
  }
}