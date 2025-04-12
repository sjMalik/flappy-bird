import './style.css'
import Phaser from 'phaser';

const isMobile = /Mobi|Android/i.test(navigator.userAgent); // Check if the device is mobile

const config = {
  type: Phaser.AUTO,
  width: isMobile ? window.innerWidth : (window.innerWidth > 512 ? 512 : window.innerWidth),
  height: isMobile ? window.innerHeight : (window.innerHeight > 512 ? 512 : window.innerHeight),
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: { preload, create, update }
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
let scoreText; // The score text
let point, hit, wing, die; // Sound effects

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
  // load sound effects
  this.load.audio('score', 'assets/point.wav');
  this.load.audio('hit', 'assets/hit.wav');
  this.load.audio('die', 'assets/die.wav');
  this.load.audio('wing', 'assets/wing.wav');
}

function create() {
  // this.add.image(400, 300, 'background');
  background = this.add.tileSprite(0, 0, game.config.width * 2, game.config.height * 2, 'background');
  background.setOrigin(0, 0); // Set the origin to the top left corner
  background.setScale(3); // Scale the background to fit the screen

  // Load the sound effects
  point = this.sound.add('score'); // Load the score sound effect
  hit = this.sound.add('hit'); // Load the hit sound effect
  wing = this.sound.add('wing'); // Load the wing sound effect
  die = this.sound.add('die'); // Load the die sound effect

  // Add the start game image
  let startGameImage = this.add.image(game.config.width / 2, game.config.height / 2, 'startGame');
  startGameImage.setOrigin(0.5, 0.5); // Set the origin to the center
  startGameImage.setInteractive(); // Make the image interactive
  startGameImage.on('pointerdown', () => {
    startGameImage.destroy(); // Destroy the start game image when clicked
    bird.setVisible(true); // Show the bird
    gameStart = true; // Set the game start flag to true

    /**
     * Create a score display that is center horizontally
     * positioned near the top of the screen.
     * The score is initialized to 0 and is updated
     * render above other game objects.
     */
    scoreText = this.add.text(game.config.width / 2, 50, '0', {
      fontSize: '32px',
      fill: '#fff'
    });
    scoreText.setOrigin(0.5, 0.5); // Set the origin to the center
    scoreText.setDepth(2); // Set the depth of the score text to 2

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
    let gap = 150;

    let buttomPiller = this.physics.add.sprite(game.config.width, game.config.height - base.height, 'piller');
    buttomPiller.displayHeight = pillerHeight; // Set the height of the piller
    buttomPiller.setOrigin(0.5, 1); // Set the origin to the bottom center
    buttomPiller.setVelocityX(-200); // Move the piller to the left

    // Crete top piller
    let topPiller = this.physics.add.sprite(game.config.width, 0, 'piller');
    topPiller.displayHeight = game.config.height - base.height - pillerHeight - gap; // Set the height of the piller
    topPiller.setOrigin(0.5, 0); // Set the origin to the top center
    topPiller.setVelocityX(-200); // Move the piller to the left
    // apply flip
    topPiller.setFlipY(true); // Flip the piller vertically

    // Crete helper function - destroy piller
    const destroyPiller = (piller) => {
      // check piller right edge less than 0
      if (piller.getBounds().right < 0) {
        piller.destroy(); // Destroy the piller
      }
    }

    // set the onWorldbounds
    buttomPiller.body.onWorldBounds = true; // Enable world bounds
    topPiller.body.onWorldBounds = true; // Enable world bounds

    // listen for world bounds and destroy the piller
    this.physics.world.on('worldbounds', function (body) {
      if (body.gameObject === buttomPiller) {
        destroyPiller(buttomPiller); // Call the destroyPiller function
      }
      if (body.gameObject === topPiller) {
        destroyPiller(topPiller); // Call the destroyPiller function
      }
    }
    );

    // Add collision detection between the bird and the piller
    this.physics.add.collider(bird, buttomPiller, hanleCollision, null, this); // Handle collision with the bottom piller
    this.physics.add.collider(bird, topPiller, hanleCollision, null, this); // Handle collision with the top piller
  }

  // Handle collision between the bird and the piller
  const hanleCollision = () => {
    // play hit sound
    hit.play(); // Play the hit sound effect
    // play die sound
    die.play(); // Play the die sound effect
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
      // play wing sound
      wing.play(); // Play the wing sound effect
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

  // Retreive all active colliders and iterate thrgough this collider
  this.physics.world.colliders.getActive().forEach((collider) => {
    // if the first object is the bird and the second object is the piller
    if (collider.object1 === bird && collider.object2.texture.key === 'piller') {
      let piller = collider.object2; // Get the piller
      // if the bird pass the piller and piller is not scored make the piller scored
      if (piller.x + piller.width / 2 < bird.x - bird.width / 2 && !piller.scored) {
        piller.scored = true; // Set the piller as scored

        // check if both the piller scored
        let pillerPair = this.physics.world.colliders.getActive().find((collider) => {
          return collider.object2 !== piller &&
            collider.object2.texture.key === 'piller' &&
            Math.abs(collider.object2.x - piller.x) < 10; // Check if the piller is scored
        });

        if (pillerPair && !pillerPair.object2.scored) {
          // play the score sound
          point.play(); // Play the score sound effect
          pillerPair.object2.scored = true; // Set the piller as scored
          scoreText.setText(parseInt(scoreText.text) + 1); // Increment the score
        }
      }
    }
  });
}