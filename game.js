/**
 * ═══════════════════════════════════════════════════════════════
 * SABUYAH - MAIN.JS
 * ملف التشغيل الرئيسي والربط بين الملفات
 * Canvas 2D - بدون مكتبات خارجية ثقيلة
 * ═══════════════════════════════════════════════════════════════
 */

// Global Game Object
const SabuyahGame = {
  // Canvas والـ Context
  canvas: null,
  ctx: null,
  
  // Configuration
  config: {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GAME_WIDTH: 400,     // لعرض الملعب
    LANES: 3,
    LANE_WIDTH: 100,
    BASE_SPEED: 3,
    MAX_SPEED: 8,
    SPEED_INCREMENT: 0.00008,
    FPS_TARGET: 60,
    GRAVITY: 0.5,
    JUMP_FORCE: 12,
    SLIDE_DURATION: 500,
    BOOST_DURATION: 4000,
    BOOST_SPEED_MULT: 1.5,
    CHASER_BASE_DISTANCE: 150,
    DANGER_THRESHOLD: 50
  },

  // Game State
  state: {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    coins: 0,
    distance: 0,
    speed: 0,
    level: 1,
    fps: 0,
    boostActive: false,
    boostMeter: 0,
    boostDuration: 0,
    dangerLevel: 0
  },

  // Game Objects
  player: null,
  chaser: null,
  obstacles: [],
  coins: [],
  powerups: [],
  particles: [],

  // Timing
  lastFrame: 0,
  deltaTime: 0,
  frameCount: 0,

  // ==================== INITIALIZATION ====================
  
  /**
   * Initialize the game
   */
  init() {
    console.log('🎮 Initializing Sabuyah Game...');
    
    // Get canvas
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('❌ Canvas not found!');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Set canvas size
    this.resizeCanvas();
    
    // Initialize game objects
    this.initializePlayer();
    this.initializeChaser();
    
    // Setup event listeners
    this.setupControls();
    
    // Start game loop
    this.lastFrame = performance.now();
    this.startGameLoop();
    
    console.log('✅ Game initialized successfully!');
  },

  /**
   * Initialize player
   */
  initializePlayer() {
    this.player = {
      x: this.config.CANVAS_WIDTH / 2,
      y: this.config.CANVAS_HEIGHT - 100,
      width: 40,
      height: 60,
      lane: 1,                    // 0, 1, 2
      targetLane: 1,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      jumpHeight: 0,
      color: '#FF6600',           // Orange
      shirtColor: '#FF5722',
      pantsColor: '#2196F3',
      scale: 1,
      rotation: 0,
      animationFrame: 0,
      animationSpeed: 0.15
    };
  },

  /**
   * Initialize chaser (العدو المطارد)
   */
  initializeChaser() {
    this.chaser = {
      x: this.config.CANVAS_WIDTH / 2,
      y: -80,
      width: 45,
      height: 70,
      distance: this.config.CHASER_BASE_DISTANCE,
      visible: false,
      speed: 0,
      color: '#1565C0',            // Dark blue uniform
      animationFrame: 0,
      animationSpeed: 0.2,
      angerLevel: 0
    };
  },

  // ==================== SETUP ====================

  /**
   * Setup keyboard and touch controls
   */
  setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.state.running || this.state.paused) return;

      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.movePlayer(-1);
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.movePlayer(1);
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          this.playerJump();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.playerSlide();
          e.preventDefault();
          break;
        case 'Shift':
          this.activateBoost();
          e.preventDefault();
          break;
      }
    });

    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.state.running || this.state.paused) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          this.movePlayer(dx > 0 ? 1 : -1);
        } else {
          // Vertical swipe
          dy < 0 ? this.playerJump() : this.playerSlide();
        }
      } else {
        // Tap
        this.playerJump();
      }
    }, { passive: true });
  },

  /**
   * Resize canvas to fit window
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.config.CANVAS_WIDTH = window.innerWidth;
    this.config.CANVAS_HEIGHT = window.innerHeight;
  },

  // ==================== PLAYER MOVEMENT ====================

  /**
   * Move player between lanes
   */
  movePlayer(direction) {
    const newLane = this.player.targetLane + direction;
    if (newLane >= 0 && newLane < this.config.LANES) {
      this.player.targetLane = newLane;
      this.playSound('move');
    }
  },

  /**
   * Player jump
   */
  playerJump() {
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isJumping = true;
      this.player.velocityY = -this.config.JUMP_FORCE;
      this.playSound('jump');
    }
  },

  /**
   * Player slide
   */
  playerSlide() {
    if (!this.player.isSliding && !this.player.isJumping) {
      this.player.isSliding = true;
      this.player.slideTimer = this.config.SLIDE_DURATION;
      this.player.scale = 0.6;
      this.playSound('slide');
    }
  },

  /**
   * Activate boost
   */
  activateBoost() {
    if (this.state.boostMeter >= 100 && !this.state.boostActive) {
      this.state.boostActive = true;
      this.state.boostDuration = this.config.BOOST_DURATION;
      this.state.boostMeter = 0;
      this.playSound('boost');
    }
  },

  // ==================== SPAWNING ====================

  /**
   * Spawn obstacle (قطار أو سيارة)
   */
  spawnObstacle() {
    if (!this.state.running || Math.random() > 0.015) return;

    const lane = Math.floor(Math.random() * this.config.LANES);
    const type = Math.random() > 0.4 ? 'train' : 'car';
    
    const obstacle = {
      x: lane * this.config.LANE_WIDTH + (this.config.CANVAS_WIDTH - this.config.GAME_WIDTH) / 2,
      y: -80,
      width: 70,
      height: type === 'train' ? 100 : 60,
      lane: lane,
      type: type,
      speed: this.state.speed,
      color: type === 'train' ? '#FF9800' : '#E91E63',
      secondaryColor: type === 'train' ? '#FFD700' : '#FF1744',
      removed: false
    };

    this.obstacles.push(obstacle);
  },

  /**
   * Spawn coin
   */
  spawnCoin() {
    if (!this.state.running || Math.random() > 0.04) return;

    const lane = Math.floor(Math.random() * this.config.LANES);
    const pattern = Math.random();

    if (pattern < 0.5) {
      this.createCoin(lane);
    } else if (pattern < 0.8) {
      // Line of coins
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.createCoin(lane);
        }, i * 300);
      }
    }
  },

  /**
   * Create single coin
   */
  createCoin(lane) {
    const coin = {
      x: lane * this.config.LANE_WIDTH + (this.config.CANVAS_WIDTH - this.config.GAME_WIDTH) / 2 + this.config.LANE_WIDTH / 2 - 10,
      y: -40,
      radius: 15,
      lane: lane,
      collected: false,
      animationFrame: 0,
      rotation: 0,
      bounce: 0
    };

    this.coins.push(coin);
  },

  /**
   * Spawn power-up
   */
  spawnPowerUp() {
    if (!this.state.running || Math.random() > 0.008) return;

    const lane = Math.floor(Math.random() * this.config.LANES);
    const types = ['magnet', 'shield', 'double'];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerup = {
      x: lane * this.config.LANE_WIDTH + (this.config.CANVAS_WIDTH - this.config.GAME_WIDTH) / 2 + this.config.LANE_WIDTH / 2 - 20,
      y: -50,
      width: 35,
      height: 35,
      lane: lane,
      type: type,
      collected: false,
      rotation: 0
    };

    this.powerups.push(powerup);
  },

  // ==================== GAME LOOP ====================

  /**
   * Start the game loop
   */
  startGameLoop() {
    const gameLoop = (currentTime) => {
      // Calculate delta time
      this.deltaTime = (currentTime - this.lastFrame) / 1000;
      this.lastFrame = currentTime;

      // Cap delta time
      if (this.deltaTime > 0.05) this.deltaTime = 0.05;

      // Update
      this.update();

      // Draw
      this.draw();

      // Request next frame
      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  },

  /**
   * Update game state
   */
  update() {
    if (!this.state.running || this.state.paused) return;

    // Update speed
    const speedMultiplier = this.state.boostActive ? this.config.BOOST_SPEED_MULT : 1;
    this.state.speed = Math.min(
      this.config.MAX_SPEED,
      this.config.BASE_SPEED + this.state.distance * this.config.SPEED_INCREMENT
    ) * speedMultiplier;

    // Update score and distance
    this.state.score += this.state.speed * 0.1;
    this.state.distance += this.state.speed * 0.1;
    this.state.level = Math.floor(this.state.distance / 500) + 1;

    // Update boost
    if (this.state.boostActive) {
      this.state.boostDuration -= this.deltaTime * 1000;
      if (this.state.boostDuration <= 0) {
        this.state.boostActive = false;
      }
    } else if (this.state.boostMeter < 100) {
      this.state.boostMeter += this.deltaTime * 10;
    }

    // Update player
    this.updatePlayer();

    // Update chaser
    this.updateChaser();

    // Update obstacles
    this.updateObstacles();

    // Update coins
    this.updateCoins();

    // Update power-ups
    this.updatePowerUps();

    // Update particles
    this.updateParticles();

    // Spawn new elements
    this.spawnObstacle();
    this.spawnCoin();
    this.spawnPowerUp();

    // Check collisions
    this.checkCollisions();

    // Update frame count for FPS
    this.frameCount++;
    if (this.frameCount >= this.config.FPS_TARGET) {
      this.state.fps = this.config.FPS_TARGET;
      this.frameCount = 0;
    }
  },

  /**
   * Update player position and state
   */
  updatePlayer() {
    // Smooth lane transition
    const targetX = this.player.targetLane * this.config.LANE_WIDTH + (this.config.CANVAS_WIDTH - this.config.GAME_WIDTH) / 2;
    this.player.x += (targetX - this.player.x) * 0.15;

    // Jump physics
    if (this.player.isJumping) {
      this.player.velocityY += this.config.GRAVITY;
      this.player.jumpHeight = Math.max(0, this.player.jumpHeight - this.config.GRAVITY * 20);
      this.player.y -= this.player.velocityY;

      if (this.player.y >= this.config.CANVAS_HEIGHT - 100) {
        this.player.y = this.config.CANVAS_HEIGHT - 100;
        this.player.isJumping = false;
        this.player.velocityY = 0;
        this.player.jumpHeight = 0;
      }
    }

    // Slide physics
    if (this.player.isSliding) {
      this.player.slideTimer -= this.deltaTime * 1000;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
        this.player.scale = 1;
      }
    } else {
      this.player.scale = 1;
    }

    // Animation
    this.player.animationFrame += this.player.animationSpeed;
    if (this.player.animationFrame >= 4) {
      this.player.animationFrame = 0;
    }
  },

  /**
   * Update chaser (العدو)
   */
  updateChaser() {
    if (this.state.distance < 300) {
      this.chaser.visible = false;
      return;
    }

    this.chaser.visible = true;

    // Chaser chases player
    const catchUpSpeed = (this.state.speed * 0.85) - this.state.speed;
    this.chaser.distance -= catchUpSpeed + 0.05;
    this.chaser.distance = Math.max(20, this.chaser.distance);

    // Position chaser
    this.chaser.x = this.player.x;
    this.chaser.y = this.player.y - this.chaser.distance;

    // Update danger level
    this.state.dangerLevel = Math.max(0, 100 - (this.chaser.distance / this.config.CHASER_BASE_DISTANCE) * 100);

    // Anger increases with danger
    this.chaser.angerLevel = this.state.dangerLevel * 0.01;

    // Game over if chaser catches player
    if (this.chaser.distance <= 30) {
      this.gameOver();
    }
  },

  /**
   * Update obstacles
   */
  updateObstacles() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.state.speed;

      // Remove if off-screen
      if (obs.y > this.config.CANVAS_HEIGHT + 100) {
        this.obstacles.splice(i, 1);
      }
    }
  },

  /**
   * Update coins
   */
  updateCoins() {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.y += this.state.speed;
      coin.rotation += 0.1;
      coin.bounce = Math.sin(coin.y * 0.01) * 5;

      // Remove if off-screen
      if (coin.y > this.config.CANVAS_HEIGHT + 50) {
        this.coins.splice(i, 1);
      }
    }
  },

  /**
   * Update power-ups
   */
  updatePowerUps() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += this.state.speed;
      pu.rotation += 0.05;

      // Remove if off-screen
      if (pu.y > this.config.CANVAS_HEIGHT + 50) {
        this.powerups.splice(i, 1);
      }
    }
  },

  /**
   * Update particles
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  /**
   * Check collisions
   */
  checkCollisions() {
    const playerRect = {
      x: this.player.x - this.player.width / 2,
      y: this.player.y - this.player.height / 2,
      width: this.player.width,
      height: this.player.height * this.player.scale
    };

    // Check obstacle collisions
    for (const obs of this.obstacles) {
      const obsRect = {
        x: obs.x - obs.width / 2,
        y: obs.y - obs.height / 2,
        width: obs.width,
        height: obs.height
      };

      // Check if same lane
      if (Math.abs(playerRect.x - obsRect.x) < this.config.LANE_WIDTH / 2) {
        if (this.AABB(playerRect, obsRect)) {
          // Can slide under cars, not trains
          if (obs.type === 'car' && this.player.isSliding) {
            continue;
          }
          this.gameOver();
        }
      }
    }

    // Check coin collisions
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const dist = Math.hypot(
        playerRect.x + playerRect.width / 2 - coin.x,
        playerRect.y + playerRect.height / 2 - coin.y
      );

      if (dist < 40) {
        this.state.coins++;
        this.state.score += 10;
        this.state.boostMeter = Math.min(100, this.state.boostMeter + 2);
        this.coins.splice(i, 1);
        this.playSound('coin');
        this.createParticles(coin.x, coin.y, '#FFD700', 5);
      }
    }

    // Check power-up collisions
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      const puRect = {
        x: pu.x - pu.width / 2,
        y: pu.y - pu.height / 2,
        width: pu.width,
        height: pu.height
      };

      if (this.AABB(playerRect, puRect)) {
        this.activatePowerUp(pu.type);
        this.powerups.splice(i, 1);
        this.playSound('powerup');
        this.createParticles(pu.x, pu.y, '#00FF00', 8);
      }
    }
  },

  /**
   * AABB collision detection
   */
  AABB(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  },

  /**
   * Activate power-up
   */
  activatePowerUp(type) {
    switch(type) {
      case 'magnet':
        // Collect nearby coins
        this.coins.forEach((coin, index) => {
          if (Math.hypot(this.player.x - coin.x, this.player.y - coin.y) < 200) {
            this.state.coins++;
            this.state.score += 10;
            this.createParticles(coin.x, coin.y, '#FFD700', 3);
            this.coins.splice(index, 1);
          }
        });
        break;
      case 'shield':
        this.player.shield = true;
        setTimeout(() => {
          this.player.shield = false;
        }, 5000);
        break;
      case 'double':
        this.state.boostMeter = Math.min(100, this.state.boostMeter + 50);
        break;
    }
  },

  /**
   * Create particles
   */
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  },

  // ==================== DRAWING ====================

  /**
   * Draw everything
   */
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB';  // Sky blue
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw game area
    this.drawGameArea();

    // Draw ground/track
    this.drawTracks();

    // Draw obstacles
    this.drawObstacles();

    // Draw coins
    this.drawCoins();

    // Draw power-ups
    this.drawPowerUps();

    // Draw player
    this.drawPlayer();

    // Draw chaser
    if (this.chaser.visible) {
      this.drawChaser();
    }

    // Draw particles
    this.drawParticles();

    // Draw UI
    this.drawUI();
  },

  /**
   * Draw game area background
   */
  drawGameArea() {
    const x = (this.canvas.width - this.config.GAME_WIDTH) / 2;
    const y = 0;

    // Background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, this.config.GAME_WIDTH, this.canvas.height);

    // Side areas
    this.ctx.fillStyle = '#D3D3D3';
    this.ctx.fillRect(0, 0, x, this.canvas.height);
    this.ctx.fillRect(x + this.config.GAME_WIDTH, 0, x, this.canvas.height);
  },

  /**
   * Draw tracks
   */
  drawTracks() {
    const x = (this.canvas.width - this.config.GAME_WIDTH) / 2;
    const trackHeight = 80;

    for (let i = 0; i < this.config.LANES; i++) {
      // Track background
      this.ctx.fillStyle = i % 2 === 0 ? '#8B7355' : '#A0826D';
      this.ctx.fillRect(
        x + i * this.config.LANE_WIDTH,
        0,
        this.config.LANE_WIDTH,
        this.canvas.height
      );

      // Rail lines
      this.ctx.strokeStyle = '#C0C0C0';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x + i * this.config.LANE_WIDTH + 5, 0);
      this.ctx.lineTo(x + i * this.config.LANE_WIDTH + 5, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x + (i + 1) * this.config.LANE_WIDTH - 5, 0);
      this.ctx.lineTo(x + (i + 1) * this.config.LANE_WIDTH - 5, this.canvas.height);
      this.ctx.stroke();

      // Sleepers (cross ties)
      this.ctx.fillStyle = '#654321';
      for (let j = -100; j < this.canvas.height + 100; j += 50) {
        this.ctx.fillRect(
          x + i * this.config.LANE_WIDTH + 2,
          j + (this.state.distance % 50),
          this.config.LANE_WIDTH - 4,
          8
        );
      }
    }
  },

  /**
   * Draw obstacles
   */
  drawObstacles() {
    for (const obs of this.obstacles) {
      if (obs.type === 'train') {
        this.drawTrain(obs);
      } else {
        this.drawCar(obs);
      }
    }
  },

  /**
   * Draw train
   */
  drawTrain(train) {
    // Main body
    this.ctx.fillStyle = train.color;
    this.ctx.fillRect(train.x - train.width / 2, train.y - train.height / 2, train.width, train.height);

    // Windows (yellow light)
    this.ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 4; i++) {
      this.ctx.fillRect(
        train.x - train.width / 2 + 10,
        train.y - train.height / 2 + 15 + i * 20,
        train.width - 20,
        12
      );
    }

    // Headlight
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.beginPath();
    this.ctx.arc(train.x, train.y - train.height / 2 - 10, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Outline
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(train.x - train.width / 2, train.y - train.height / 2, train.width, train.height);
  },

  /**
   * Draw car
   */
  drawCar(car) {
    // Main body
    this.ctx.fillStyle = car.color;
    this.ctx.fillRect(car.x - car.width / 2, car.y - car.height / 2, car.width, car.height);

    // Windshield
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(
      car.x - car.width / 2 + 5,
      car.y - car.height / 2 + 5,
      car.width - 10,
      car.height / 3
    );

    // Wheels
    this.ctx.fillStyle = '#333';
    const wheelRadius = 6;
    this.ctx.beginPath();
    this.ctx.arc(car.x - car.width / 3, car.y + car.height / 2 - wheelRadius, wheelRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(car.x + car.width / 3, car.y + car.height / 2 - wheelRadius, wheelRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Hub caps
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.beginPath();
    this.ctx.arc(car.x - car.width / 3, car.y + car.height / 2 - wheelRadius, wheelRadius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(car.x + car.width / 3, car.y + car.height / 2 - wheelRadius, wheelRadius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // Outline
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(car.x - car.width / 2, car.y - car.height / 2, car.width, car.height);
  },

  /**
   * Draw coins
   */
  drawCoins() {
    for (const coin of this.coins) {
      // Coin body
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y + coin.bounce, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Shine
      this.ctx.fillStyle = '#FFED4E';
      this.ctx.beginPath();
      this.ctx.arc(coin.x - coin.radius / 3, coin.y - coin.radius / 3 + coin.bounce, coin.radius / 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Rotation effect (edges)
      this.ctx.strokeStyle = '#FFA500';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y + coin.bounce, coin.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  },

  /**
   * Draw power-ups
   */
  drawPowerUps() {
    for (const pu of this.powerups) {
      this.ctx.save();
      this.ctx.translate(pu.x, pu.y);
      this.ctx.rotate(pu.rotation);

      switch(pu.type) {
        case 'magnet':
          this.ctx.fillStyle = '#FF6B6B';
          this.ctx.fillRect(-pu.width / 2, -pu.height / 2, pu.width / 2, pu.height);
          this.ctx.fillStyle = '#4ECDC4';
          this.ctx.fillRect(0, -pu.height / 2, pu.width / 2, pu.height);
          break;
        case 'shield':
          this.ctx.fillStyle = '#00BCD4';
          this.ctx.beginPath();
          this.ctx.moveTo(0, -pu.height / 2);
          this.ctx.lineTo(pu.width / 2, pu.height / 4);
          this.ctx.lineTo(pu.width / 2, pu.height / 2);
          this.ctx.lineTo(-pu.width / 2, pu.height / 2);
          this.ctx.lineTo(-pu.width / 2, pu.height / 4);
          this.ctx.fill();
          break;
        case 'double':
          this.ctx.fillStyle = '#FF00FF';
          this.ctx.fillRect(-pu.width / 2, -pu.height / 2, pu.width, pu.height);
          this.ctx.fillStyle = '#FFF';
          this.ctx.font = 'bold 20px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('×2', 0, 0);
          break;
      }

      this.ctx.restore();
    }
  },

  /**
   * Draw player
   */
  drawPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.scale(1, this.player.scale);

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 35, 20, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Head (skin tone)
    this.ctx.fillStyle = '#FFCC80';
    this.ctx.beginPath();
    this.ctx.arc(0, -20, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Cap (red)
    this.ctx.fillStyle = '#D32F2F';
    this.ctx.fillRect(-16, -33, 32, 10);
    this.ctx.fillRect(-18, -28, 36, 5);

    // Eyes
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(-6, -23, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(6, -23, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Pupils
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(-6, -23, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(6, -23, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Smile
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(0, -15, 5, 0.2, Math.PI - 0.2);
    this.ctx.stroke();

    // Body (shirt orange)
    this.ctx.fillStyle = this.player.shirtColor;
    this.ctx.fillRect(-14, -5, 28, 25);

    // White stripe
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(-14, 5, 28, 3);

    // Pants (blue)
    this.ctx.fillStyle = this.player.pantsColor;
    this.ctx.fillRect(-12, 20, 24, 20);

    // Arms animation
    const armSwing = Math.sin(this.player.animationFrame * Math.PI) * 15;
    this.ctx.fillStyle = '#FFCC80';
    // Left arm
    this.ctx.save();
    this.ctx.translate(-14, 0);
    this.ctx.rotate((armSwing + 30) * Math.PI / 180);
    this.ctx.fillRect(-5, 0, 10, 20);
    this.ctx.restore();

    // Right arm
    this.ctx.save();
    this.ctx.translate(14, 0);
    this.ctx.rotate((-armSwing - 30) * Math.PI / 180);
    this.ctx.fillRect(-5, 0, 10, 20);
    this.ctx.restore();

    // Shoes (white)
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(-10, 40, 8, 8);
    this.ctx.fillRect(2, 40, 8, 8);

    // Shield if active
    if (this.player.shield) {
      this.ctx.strokeStyle = '#00BCD4';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  },

  /**
   * Draw chaser (enemy)
   */
  drawChaser() {
    this.ctx.save();
    this.ctx.translate(this.chaser.x, this.chaser.y);

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 40, 25, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Head
    this.ctx.fillStyle = '#FFCC80';
    this.ctx.beginPath();
    this.ctx.arc(0, -10, 18, 0, Math.PI * 2);
    this.ctx.fill();

    // Hat (police)
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-20, -30, 40, 15);
    this.ctx.fillRect(-22, -28, 44, 3);

    // ANGRY eyes (red)
    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.arc(-8, -12, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(8, -12, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Angry eyebrows
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-12, -15);
    this.ctx.lineTo(-4, -13);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(12, -15);
    this.ctx.lineTo(4, -13);
    this.ctx.stroke();

    // Mustache
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, -5, 8, Math.PI, 0);
    this.ctx.stroke();

    // Body (uniform blue)
    this.ctx.fillStyle = this.chaser.color;
    this.ctx.fillRect(-16, 8, 32, 30);

    // Badge
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(-6, 15, 12, 12);
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 8px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('P', 0, 21);

    // Arms
    this.ctx.fillStyle = '#FFCC80';
    this.ctx.fillRect(-16, 8, 8, 28);
    this.ctx.fillRect(8, 8, 8, 28);

    // Legs
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-10, 38, 8, 20);
    this.ctx.fillRect(2, 38, 8, 20);

    // Flashlight beam
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(0, 50, 80, Math.PI * 0.3, Math.PI * 0.7);
    this.ctx.fill();

    // Danger aura (if close)
    if (this.state.dangerLevel > 50) {
      this.ctx.strokeStyle = `rgba(255, 0, 0, ${(this.state.dangerLevel / 100) * 0.5})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 15, 35, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  },

  /**
   * Draw particles
   */
  drawParticles() {
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  },

  /**
   * Draw UI
   */
  drawUI() {
    const padding = 10;
    const fontSize = 16;

    this.ctx.fillStyle = '#000';
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Score
    this.ctx.fillText(`Score: ${Math.floor(this.state.score)}`, padding, padding);

    // Coins
    this.ctx.fillText(`💰 ${this.state.coins}`, padding, padding + 25);

    // Level
    this.ctx.fillText(`Level: ${this.state.level}`, padding, padding + 50);

    // Distance
    this.ctx.fillText(`Distance: ${Math.floor(this.state.distance)}m`, padding, padding + 75);

    // Boost meter
    const boostX = padding;
    const boostY = this.canvas.height - padding - 30;
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boostX, boostY, 150, 20);
    this.ctx.fillStyle = this.state.boostActive ? '#00FF00' : '#FFD700';
    this.ctx.fillRect(boostX + 2, boostY + 2, (this.state.boostMeter / 100) * 146, 16);
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOOST', boostX + 75, boostY + 10);

    // Danger meter
    if (this.chaser.visible) {
      const dangerX = this.canvas.width - padding - 150;
      const dangerY = padding;
      this.ctx.strokeStyle = this.state.dangerLevel > 75 ? '#FF0000' : '#FFA500';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(dangerX, dangerY, 150, 20);
      this.ctx.fillStyle = this.state.dangerLevel > 75 ? '#FF0000' : '#FFA500';
      this.ctx.fillRect(dangerX + 2, dangerY + 2, (this.state.dangerLevel / 100) * 146, 16);
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DANGER', dangerX + 75, dangerY + 10);
    }

    // FPS (debug)
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`FPS: ${Math.floor(1 / this.deltaTime)}`, this.canvas.width - 10, 10);
  },

  // ==================== GAME FLOW ====================

  /**
   * Start the game
   */
  start() {
    console.log('🎮 Game started!');
    this.state.running = true;
    this.state.gameOver = false;
    this.state.paused = false;

    // Reset state
    this.initializePlayer();
    this.initializeChaser();
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.particles = [];

    // Reset game state
    this.state.score = 0;
    this.state.coins = 0;
    this.state.distance = 0;
    this.state.speed = this.config.BASE_SPEED;
    this.state.level = 1;
    this.state.boostActive = false;
    this.state.boostMeter = 0;
    this.state.dangerLevel = 0;
  },

  /**
   * Game over
   */
  gameOver() {
    console.log('💀 Game Over! Score:', Math.floor(this.state.score));
    this.state.running = false;
    this.state.gameOver = true;

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('gameOver', {
      detail: {
        score: Math.floor(this.state.score),
        coins: this.state.coins,
        distance: Math.floor(this.state.distance),
        level: this.state.level,
        maxSpeed: this.state.speed
      }
    }));

    this.playSound('crash');
  },

  /**
   * Pause/Resume
   */
  togglePause() {
    this.state.paused = !this.state.paused;
  },

  // ==================== SOUND ====================

  /**
   * Play sound effect
   */
  playSound(type) {
    if (typeof SabuyahAudio !== 'undefined') {
      SabuyahAudio.play(type);
    }
  }
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Sabuyah Game - Main.js loaded');
  SabuyahGame.init();

  // Make game accessible globally
  window.SabuyahGame = SabuyahGame;
});
