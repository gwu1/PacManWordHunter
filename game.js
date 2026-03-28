class GhostWordGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.speechEnabled = true;
        
        // Game entities
        this.player = null;
        this.ghosts = [];
        this.targetWord = null;
        this.targetGhost = null;
        
        // Word management
        this.customWords = [];
        this.defaultWords = this.getDefaultWords();
        this.currentWordSet = [...this.defaultWords];
        
        // Speech synthesis
        this.synth = window.speechSynthesis;
        this.speechInterval = null;
        
        // Background music
        this.backgroundMusic = document.getElementById('background-music');
        
        this.init();
    }
    
    getDefaultWords() {
        return [
            { english: 'apple', chinese: '蘋果' },
            { english: 'banana', chinese: '香蕉' },
            { english: 'cat', chinese: '貓' },
            { english: 'dog', chinese: '狗' },
            { english: 'elephant', chinese: '大象' },
            { english: 'fish', chinese: '魚' },
            { english: 'green', chinese: '綠色' },
            { english: 'house', chinese: '房子' },
            { english: 'ice cream', chinese: '冰淇淋' },
            { english: 'juice', chinese: '果汁' },
            { english: 'kite', chinese: '風箏' },
            { english: 'lion', chinese: '獅子' },
            { english: 'moon', chinese: '月亮' },
            { english: 'night', chinese: '夜晚' },
            { english: 'orange', chinese: '橙色' },
            { english: 'pencil', chinese: '鉛筆' },
            { english: 'queen', chinese: '女王' },
            { english: 'rabbit', chinese: '兔子' },
            { english: 'sun', chinese: '太陽' },
            { english: 'tree', chinese: '樹' }
        ];
    }
    
    getPersonalityWords() {
        return [
            { english: 'brave', chinese: '勇敢' },
            { english: 'cheerful', chinese: '快樂' },
            { english: 'funny', chinese: '有趣' },
            { english: 'gentle', chinese: '溫柔' },
            { english: 'honest', chinese: '誠實' },
            { english: 'kind', chinese: '友善' },
            { english: 'popular', chinese: '受歡迎' },
            { english: 'smart', chinese: '聰明' }
        ];
    }
    
    getRandomMixWords() {
        const defaultWords = this.getDefaultWords();
        const personalityWords = this.getPersonalityWords();
        return [...defaultWords, ...personalityWords];
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.loadSettings();
        this.displayVersion();
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Make canvas responsive for mobile
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Create player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 20,
            speed: 5,
            color: '#FFFF00',
            mouthAngle: 0,
            mouthDirection: 1
        };
    }
    
    resizeCanvas() {
        // Scale canvas for mobile devices
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 200;
        const scale = Math.min(maxWidth / 800, maxHeight / 600, 1);
        
        this.canvas.style.width = (800 * scale) + 'px';
        this.canvas.style.height = (600 * scale) + 'px';
        this.canvas.style.touchAction = 'none'; // Prevent browser touch actions
    }
    
    setupEventListeners() {
        // Game controls
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('welcome-start-btn').addEventListener('click', () => this.startGameFromWelcome());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        
        // Settings modal
        const modal = document.getElementById('settings-modal');
        document.getElementById('settings-btn').addEventListener('click', () => {
            modal.style.display = 'block';
        });
        
        document.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Settings controls
        document.getElementById('save-words').addEventListener('click', () => this.saveCustomWords());
        document.getElementById('use-default').addEventListener('click', () => this.useDefaultWords());
        document.getElementById('music-toggle').addEventListener('change', (e) => {
            this.musicEnabled = e.target.checked;
            this.updateMusic();
        });
        document.getElementById('speech-toggle').addEventListener('change', (e) => {
            this.speechEnabled = e.target.checked;
            this.updateSpeech();
        });
        
        // Word set selection
        const wordSetRadios = document.querySelectorAll('input[name="word-set"]');
        wordSetRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.selectWordSet(e.target.value));
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Mouse/Touch controls
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent default touch behaviors on canvas for iOS Safari
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Store touch position for continuous movement
        this.touchPosition = null;
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        let newX = this.player.x;
        let newY = this.player.y;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                newY -= this.player.speed;
                break;
            case 'ArrowDown':
            case 's':
                newY += this.player.speed;
                break;
            case 'ArrowLeft':
            case 'a':
                newX -= this.player.speed;
                break;
            case 'ArrowRight':
            case 'd':
                newX += this.player.speed;
                break;
        }
        
        // Check boundaries and maze walls
        if (newX >= this.player.radius && newX <= this.canvas.width - this.player.radius &&
            newY >= this.player.radius && newY <= this.canvas.height - this.player.radius &&
            !this.isInMazeWall(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
        }
    }
    
    handleMouseMove(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Move player towards mouse position
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const newX = this.player.x + (dx / distance) * this.player.speed;
            const newY = this.player.y + (dy / distance) * this.player.speed;
            
            // Check boundaries and maze walls
            if (newX >= this.player.radius && newX <= this.canvas.width - this.player.radius &&
                newY >= this.player.radius && newY <= this.canvas.height - this.player.radius &&
                !this.isInMazeWall(newX, newY)) {
                this.player.x = newX;
                this.player.y = newY;
            }
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (!this.gameRunning || this.gamePaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        
        // Calculate touch coordinates properly for iOS Safari
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;
        
        // Store touch position for continuous movement
        this.touchPosition = { x: touchX, y: touchY };
        
        // Move player immediately to touch position
        this.movePlayerTowards(touchX, touchY);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.gameRunning || this.gamePaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        
        // Calculate touch coordinates properly for iOS Safari
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;
        
        // Update touch position
        this.touchPosition = { x: touchX, y: touchY };
        
        // Move player towards touch position
        this.movePlayerTowards(touchX, touchY);
    }
    
    movePlayerTowards(targetX, targetY) {
        // Move player towards target position
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const newX = this.player.x + (dx / distance) * this.player.speed;
            const newY = this.player.y + (dy / distance) * this.player.speed;
            
            // Check boundaries and maze walls
            if (newX >= this.player.radius && newX <= this.canvas.width - this.player.radius &&
                newY >= this.player.radius && newY <= this.canvas.height - this.player.radius &&
                !this.isInMazeWall(newX, newY)) {
                this.player.x = newX;
                this.player.y = newY;
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        // Clear touch position when touch ends
        this.touchPosition = null;
    }
    
    startGameFromWelcome() {
        // Hide welcome overlay
        const welcomeOverlay = document.getElementById('welcome-overlay');
        welcomeOverlay.style.display = 'none';
        
        // Start the game
        this.startGame();
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.updateScore();
        
        // Initialize ghosts
        this.createGhosts();
        this.selectNewTargetWord();
        
        // Start game loop
        this.gameLoop();
        
        // Start background music
        if (this.musicEnabled) {
            this.backgroundMusic.play().catch(e => console.log('Music play failed:', e));
        }
        
        // Start word pronunciation
        if (this.speechEnabled) {
            this.startWordSpeech();
        }
        
        document.getElementById('start-btn').textContent = 'Restart Game';
    }
    
    createGhosts() {
        this.ghosts = [];
        const numGhosts = 8;
        
        for (let i = 0; i < numGhosts; i++) {
            const word = this.currentWordSet[i % this.currentWordSet.length];
            this.ghosts.push({
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: Math.random() * (this.canvas.height - 60) + 30,
                radius: 25,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                word: word,
                color: this.getRandomGhostColor(),
                isTarget: false
            });
        }
    }
    
    getRandomGhostColor() {
        // Classic Pac-Man ghost colors
        const colors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852']; // Red, Pink, Cyan, Orange
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    selectNewTargetWord() {
        // Clear previous target
        if (this.targetGhost) {
            this.targetGhost.isTarget = false;
        }
        
        // Select new target word
        const availableWords = this.currentWordSet.filter(word => !this.targetWord || word.english !== this.targetWord.english);
        this.targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        
        // Find ghost with target word
        this.targetGhost = this.ghosts.find(ghost => ghost.word.english === this.targetWord.english);
        if (this.targetGhost) {
            this.targetGhost.isTarget = true;
        } else {
            // Fallback: if no ghost has the target word, assign it to a random ghost
            console.warn('No ghost found with target word, assigning to random ghost');
            const randomGhost = this.ghosts[Math.floor(Math.random() * this.ghosts.length)];
            randomGhost.word = this.targetWord;
            randomGhost.isTarget = true;
            this.targetGhost = randomGhost;
        }
        
        // Update display
        this.updateWordDisplay();
        
        // Restart speech for new word
        if (this.speechEnabled && this.gameRunning) {
            this.startWordSpeech();
        }
    }
    
    updateWordDisplay() {
        document.getElementById('target-word').textContent = this.targetWord ? this.targetWord.english.toUpperCase() : '';
        document.getElementById('word-translation').textContent = this.targetWord ? this.targetWord.chinese : '';
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (!this.gamePaused) {
            this.update();
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update ghost positions
        this.ghosts.forEach(ghost => {
            ghost.x += ghost.speedX;
            ghost.y += ghost.speedY;
            
            // Bounce off walls
            if (ghost.x <= ghost.radius || ghost.x >= this.canvas.width - ghost.radius) {
                ghost.speedX = -ghost.speedX;
            }
            if (ghost.y <= ghost.radius || ghost.y >= this.canvas.height - ghost.radius) {
                ghost.speedY = -ghost.speedY;
            }
            
            // Keep ghosts in bounds
            ghost.x = Math.max(ghost.radius, Math.min(this.canvas.width - ghost.radius, ghost.x));
            ghost.y = Math.max(ghost.radius, Math.min(this.canvas.height - ghost.radius, ghost.y));
        });
        
        // Check collisions
        this.checkCollisions();
    }
    
    checkCollisions() {
        this.ghosts.forEach(ghost => {
            const dx = this.player.x - ghost.x;
            const dy = this.player.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.radius + ghost.radius) {
                if (ghost.isTarget) {
                    // Player caught the correct ghost
                    this.score += 10;
                    this.updateScore();
                    this.selectNewTargetWord();
                    this.playSuccessSound();
                } else {
                    // Player caught wrong ghost
                    this.score = Math.max(0, this.score - 5);
                    this.updateScore();
                    this.playErrorSound();
                }
                
                // Remove caught ghost and create new one
                const index = this.ghosts.indexOf(ghost);
                this.ghosts.splice(index, 1);
                
                // Create new ghost
                const word = this.currentWordSet[Math.floor(Math.random() * this.currentWordSet.length)];
                this.ghosts.push({
                    x: Math.random() * (this.canvas.width - 60) + 30,
                    y: Math.random() * (this.canvas.height - 60) + 30,
                    radius: 25,
                    speedX: (Math.random() - 0.5) * 2,
                    speedY: (Math.random() - 0.5) * 2,
                    word: word,
                    color: this.getRandomGhostColor(),
                    isTarget: false
                });
                
                // Update target ghost reference if needed
                if (ghost.isTarget) {
                    this.targetGhost = this.ghosts.find(g => g.word.english === this.targetWord.english);
                    if (this.targetGhost) {
                        this.targetGhost.isTarget = true;
                    } else {
                        // If no ghost has the target word, assign it to a random ghost
                        console.warn('No ghost found with target word after collision, assigning to random ghost');
                        const randomGhost = this.ghosts[Math.floor(Math.random() * this.ghosts.length)];
                        randomGhost.word = this.targetWord;
                        randomGhost.isTarget = true;
                        this.targetGhost = randomGhost;
                    }
                }
            }
        });
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze elements
        this.drawMaze();
        
        // Draw dots for Pac-Man feel
        this.drawDots();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.drawGhost(ghost);
        });
        
        // Draw player
        this.drawPlayer();
    }
    
    drawGhost(ghost) {
        const ctx = this.ctx;
        
        // Ghost body - classic Pac-Man ghost shape
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        
        // Head (semi-circle)
        ctx.arc(ghost.x, ghost.y - ghost.radius/3, ghost.radius, Math.PI, 0, false);
        
        // Body with wavy bottom
        const waveHeight = 8;
        const waveCount = 4;
        ctx.lineTo(ghost.x + ghost.radius, ghost.y + ghost.radius/2);
        
        for (let i = 0; i < waveCount; i++) {
            const waveX = ghost.x + ghost.radius - (i * (ghost.radius * 2 / waveCount));
            const waveY = ghost.y + ghost.radius/2 + (i % 2 === 0 ? waveHeight : -waveHeight);
            if (i === waveCount - 1) {
                ctx.lineTo(ghost.x - ghost.radius, ghost.y + ghost.radius/2);
            } else {
                ctx.lineTo(waveX, waveY);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Ghost eyes - classic Pac-Man style
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ghost.x - ghost.radius/3, ghost.y - ghost.radius/3, ghost.radius/3, 0, Math.PI * 2);
        ctx.arc(ghost.x + ghost.radius/3, ghost.y - ghost.radius/3, ghost.radius/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Ghost pupils
        ctx.fillStyle = '#0000FF'; // Blue pupils like in Pac-Man
        ctx.beginPath();
        ctx.arc(ghost.x - ghost.radius/3, ghost.y - ghost.radius/3, ghost.radius/6, 0, Math.PI * 2);
        ctx.arc(ghost.x + ghost.radius/3, ghost.y - ghost.radius/3, ghost.radius/6, 0, Math.PI * 2);
        ctx.fill();
        
        // Target indicator - glowing effect
        if (ghost.isTarget) {
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(ghost.x, ghost.y, ghost.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Word label
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(ghost.word.english.toUpperCase(), ghost.x, ghost.y + ghost.radius + 25);
        ctx.shadowBlur = 0;
    }
    
    drawPlayer() {
        const ctx = this.ctx;
        
        // Animate mouth
        this.player.mouthAngle += this.player.mouthDirection * 0.1;
        if (this.player.mouthAngle > 0.3 || this.player.mouthAngle < 0) {
            this.player.mouthDirection *= -1;
        }
        
        // Draw Pac-Man body
        ctx.fillStyle = this.player.color;
        ctx.beginPath();
        
        // Calculate mouth position based on movement direction
        let mouthStart = 0;
        let mouthEnd = Math.PI * 2;
        
        if (this.player.mouthAngle > 0) {
            // Simple mouth animation - opening and closing
            mouthStart = this.player.mouthAngle * Math.PI;
            mouthEnd = (2 - this.player.mouthAngle) * Math.PI;
        }
        
        ctx.arc(this.player.x, this.player.y, this.player.radius, mouthStart, mouthEnd);
        ctx.lineTo(this.player.x, this.player.y);
        ctx.closePath();
        ctx.fill();
        
        // Add eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y - this.player.radius/2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMaze() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // Draw maze walls - updated layout with openings
        const walls = [
            // Outer walls
            { x1: 50, y1: 50, x2: 750, y2: 50 },
            { x1: 750, y1: 50, x2: 750, y2: 550 },
            { x1: 750, y1: 550, x2: 50, y2: 550 },
            { x1: 50, y1: 550, x2: 50, y2: 50 },
            
            // Inner maze structures with openings
            { x1: 150, y1: 150, x2: 250, y2: 150 },
            { x1: 250, y1: 150, x2: 250, y2: 230 }, // Shorter wall
            { x1: 550, y1: 150, x2: 650, y2: 150 },
            { x1: 550, y1: 150, x2: 550, y2: 230 }, // Shorter wall
            { x1: 150, y1: 450, x2: 250, y2: 450 },
            { x1: 150, y1: 370, x2: 150, y2: 450 }, // Shorter wall
            { x1: 550, y1: 450, x2: 650, y2: 450 },
            { x1: 650, y1: 370, x2: 650, y2: 450 }, // Shorter wall
            
            // Center structures - U-shape with openings
            { x1: 350, y1: 250, x2: 450, y2: 250 },
            { x1: 350, y1: 350, x2: 450, y2: 350 },
            { x1: 350, y1: 250, x2: 350, y2: 300 }, // Left wall with opening
            { x1: 450, y1: 300, x2: 450, y2: 350 }  // Right wall with opening
        ];
        
        walls.forEach(wall => {
            ctx.beginPath();
            ctx.moveTo(wall.x1, wall.y1);
            ctx.lineTo(wall.x2, wall.y2);
            ctx.stroke();
        });
    }
    
    drawDots() {
        const ctx = this.ctx;
        ctx.fillStyle = '#FFFF00';
        
        // Draw dots in a grid pattern, avoiding maze walls
        const dotSpacing = 40;
        const dotRadius = 3;
        
        for (let x = 70; x < this.canvas.width - 70; x += dotSpacing) {
            for (let y = 70; y < this.canvas.height - 70; y += dotSpacing) {
                // Skip dots that would be inside maze walls
                if (!this.isInMazeWall(x, y)) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // Draw power pellets (larger dots)
        const powerPellets = [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 100, y: 500 },
            { x: 700, y: 500 }
        ];
        
        powerPellets.forEach(pellet => {
            ctx.fillStyle = '#FFFF00';
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pellet.x, pellet.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    isInMazeWall(x, y) {
        // Simple collision detection for maze walls
        const walls = [
            // Outer walls (keep these)
            { x: 50, y: 50, width: 700, height: 10 },
            { x: 50, y: 50, width: 10, height: 500 },
            { x: 740, y: 50, width: 10, height: 500 },
            { x: 50, y: 540, width: 700, height: 10 },
            
            // Inner maze structures (with openings)
            { x: 150, y: 150, width: 100, height: 10 },
            { x: 250, y: 150, width: 10, height: 80 }, // Shorter wall with opening
            { x: 550, y: 150, width: 100, height: 10 },
            { x: 550, y: 150, width: 10, height: 80 }, // Shorter wall with opening
            { x: 150, y: 450, width: 100, height: 10 },
            { x: 150, y: 370, width: 10, height: 80 }, // Shorter wall with opening
            { x: 550, y: 450, width: 100, height: 10 },
            { x: 650, y: 370, width: 10, height: 80 }, // Shorter wall with opening
            
            // Center structures - create a U-shape with openings
            { x: 350, y: 250, width: 100, height: 10 },
            { x: 350, y: 350, width: 100, height: 10 },
            { x: 350, y: 250, width: 10, height: 50 }, // Left wall with opening at bottom
            { x: 450, y: 300, width: 10, height: 50 }  // Right wall with opening at top
        ];
        
        return walls.some(wall => 
            x >= wall.x && x <= wall.x + wall.width &&
            y >= wall.y && y <= wall.y + wall.height
        );
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pause-btn').textContent = this.gamePaused ? 'Resume' : 'Pause';
        
        if (this.gamePaused) {
            this.backgroundMusic.pause();
            this.stopWordSpeech();
        } else {
            if (this.musicEnabled) {
                this.backgroundMusic.play().catch(e => console.log('Music resume failed:', e));
            }
            if (this.speechEnabled) {
                this.startWordSpeech();
            }
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('sound-toggle').textContent = this.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
        
        if (!this.soundEnabled) {
            this.backgroundMusic.pause();
            this.stopWordSpeech();
        } else if (!this.gamePaused && this.gameRunning) {
            if (this.musicEnabled) {
                this.backgroundMusic.play().catch(e => console.log('Music play failed:', e));
            }
            if (this.speechEnabled) {
                this.startWordSpeech();
            }
        }
    }
    
    startWordSpeech() {
        this.stopWordSpeech();
        
        if (!this.speechEnabled || !this.targetWord) return;
        
        const speakWord = () => {
            if (!this.speechEnabled || !this.targetWord || this.gamePaused) return;
            
            const utterance = new SpeechSynthesisUtterance(this.targetWord.english);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.volume = 0.8;
            
            this.synth.speak(utterance);
        };
        
        // Speak immediately
        speakWord();
        
        // Then repeat every 3 seconds
        this.speechInterval = setInterval(speakWord, 3000);
    }
    
    stopWordSpeech() {
        if (this.speechInterval) {
            clearInterval(this.speechInterval);
            this.speechInterval = null;
        }
        this.synth.cancel();
    }
    
    updateMusic() {
        if (this.musicEnabled && this.gameRunning && !this.gamePaused && this.soundEnabled) {
            this.backgroundMusic.play().catch(e => console.log('Music play failed:', e));
        } else {
            this.backgroundMusic.pause();
        }
    }
    
    updateSpeech() {
        if (this.speechEnabled && this.gameRunning && !this.gamePaused && this.soundEnabled) {
            this.startWordSpeech();
        } else {
            this.stopWordSpeech();
        }
    }
    
    playSuccessSound() {
        if (!this.soundEnabled) return;
        
        // Create an epic success sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create multiple oscillators for a rich sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const oscillator3 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        // Connect nodes
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        oscillator3.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Setup filter for a warmer sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioContext.currentTime);
        filter.Q.setValueAtTime(5, audioContext.currentTime);
        
        // Setup oscillators with different waveforms for richness
        oscillator1.type = 'square';
        oscillator2.type = 'sawtooth';
        oscillator3.type = 'sine';
        
        // Create an ascending arpeggio with a flourish
        const now = audioContext.currentTime;
        
        // First note - C5
        oscillator1.frequency.setValueAtTime(523.25, now);
        oscillator2.frequency.setValueAtTime(523.25 * 0.5, now); // One octave lower
        oscillator3.frequency.setValueAtTime(523.25 * 2, now);  // One octave higher
        
        // Second note - E5
        oscillator1.frequency.setValueAtTime(659.25, now + 0.1);
        oscillator2.frequency.setValueAtTime(659.25 * 0.5, now + 0.1);
        oscillator3.frequency.setValueAtTime(659.25 * 2, now + 0.1);
        
        // Third note - G5
        oscillator1.frequency.setValueAtTime(783.99, now + 0.2);
        oscillator2.frequency.setValueAtTime(783.99 * 0.5, now + 0.2);
        oscillator3.frequency.setValueAtTime(783.99 * 2, now + 0.2);
        
        // Fourth note - C6 (higher C for flourish)
        oscillator1.frequency.setValueAtTime(1046.50, now + 0.3);
        oscillator2.frequency.setValueAtTime(1046.50 * 0.5, now + 0.3);
        oscillator3.frequency.setValueAtTime(1046.50 * 2, now + 0.3);
        
        // Fifth note - E6 (final flourish)
        oscillator1.frequency.setValueAtTime(1318.51, now + 0.4);
        oscillator2.frequency.setValueAtTime(1318.51 * 0.5, now + 0.4);
        oscillator3.frequency.setValueAtTime(1318.51 * 2, now + 0.4);
        
        // Create a dynamic envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05); // Quick attack
        gainNode.gain.setValueAtTime(0.3, now + 0.1);
        gainNode.gain.setValueAtTime(0.35, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now + 0.3);
        gainNode.gain.setValueAtTime(0.25, now + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8); // Long release
        
        // Add some filter modulation for extra coolness
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.2);
        filter.frequency.exponentialRampToValueAtTime(1500, now + 0.8);
        
        // Start and stop oscillators
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator3.start(now);
        oscillator1.stop(now + 0.8);
        oscillator2.stop(now + 0.8);
        oscillator3.stop(now + 0.8);
        
        // Add a second layer with a delay for echo effect
        setTimeout(() => {
            if (this.soundEnabled) {
                const delayContext = new (window.AudioContext || window.webkitAudioContext)();
                const delayOsc = delayContext.createOscillator();
                const delayGain = delayContext.createGain();
                const delayFilter = delayContext.createBiquadFilter();
                
                delayOsc.connect(delayFilter);
                delayFilter.connect(delayGain);
                delayGain.connect(delayContext.destination);
                
                delayOsc.type = 'triangle';
                delayFilter.type = 'highpass';
                delayFilter.frequency.setValueAtTime(1000, delayContext.currentTime);
                
                const delayNow = delayContext.currentTime;
                delayOsc.frequency.setValueAtTime(1046.50, delayNow);
                delayOsc.frequency.setValueAtTime(1318.51, delayNow + 0.1);
                
                delayGain.gain.setValueAtTime(0, delayNow);
                delayGain.gain.linearRampToValueAtTime(0.15, delayNow + 0.02);
                delayGain.gain.exponentialRampToValueAtTime(0.01, delayNow + 0.3);
                
                delayOsc.start(delayNow);
                delayOsc.stop(delayNow + 0.3);
            }
        }, 150);
    }
    
    playErrorSound() {
        if (!this.soundEnabled) return;
        
        // Create a dramatic error sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create multiple oscillators for a harsh sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const distortion = audioContext.createWaveShaper();
        
        // Create distortion curve for harsher sound
        const distortionCurve = new Float32Array(256);
        for (let i = 0; i < 128; i++) {
            distortionCurve[i] = i / 128;
        }
        for (let i = 128; i < 256; i++) {
            distortionCurve[i] = 2 - (i / 128);
        }
        distortion.curve = distortionCurve;
        distortion.oversample = '4x';
        
        // Connect nodes
        oscillator1.connect(distortion);
        oscillator2.connect(distortion);
        distortion.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Setup filter for a harsh sound
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);
        filter.Q.setValueAtTime(10, audioContext.currentTime);
        
        // Setup oscillators with harsh waveforms
        oscillator1.type = 'sawtooth';
        oscillator2.type = 'square';
        
        // Create a descending dissonant sequence
        const now = audioContext.currentTime;
        
        // First note - harsh C#4
        oscillator1.frequency.setValueAtTime(277.18, now);
        oscillator2.frequency.setValueAtTime(277.18 * 0.9, now); // Slightly detuned for dissonance
        
        // Second note - descending to A3
        oscillator1.frequency.setValueAtTime(220, now + 0.15);
        oscillator2.frequency.setValueAtTime(220 * 0.9, now + 0.15);
        
        // Third note - descending to F3
        oscillator1.frequency.setValueAtTime(174.61, now + 0.3);
        oscillator2.frequency.setValueAtTime(174.61 * 0.9, now + 0.3);
        
        // Create a dramatic envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.15);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.17); // Small bump
        gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6); // Long fade out
        
        // Add filter modulation for extra harshness
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);
        
        // Start and stop oscillators
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.6);
        oscillator2.stop(now + 0.6);
        
        // Add a second layer with noise for extra impact
        setTimeout(() => {
            if (this.soundEnabled) {
                const noiseContext = new (window.AudioContext || window.webkitAudioContext)();
                const bufferSize = noiseContext.sampleRate * 0.2;
                const buffer = noiseContext.createBuffer(1, bufferSize, noiseContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                // Generate white noise
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                const noiseSource = noiseContext.createBufferSource();
                const noiseGain = noiseContext.createGain();
                const noiseFilter = noiseContext.createBiquadFilter();
                
                noiseSource.buffer = buffer;
                noiseSource.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(noiseContext.destination);
                
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.setValueAtTime(1500, noiseContext.currentTime);
                
                const noiseNow = noiseContext.currentTime;
                noiseGain.gain.setValueAtTime(0, noiseNow);
                noiseGain.gain.linearRampToValueAtTime(0.2, noiseNow + 0.01);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, noiseNow + 0.15);
                
                noiseSource.start(noiseNow);
            }
        }, 100);
    }
    
    saveCustomWords() {
        const textarea = document.getElementById('custom-words');
        const lines = textarea.value.trim().split('\n');
        
        this.customWords = [];
        
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length === 2) {
                const english = parts[0].trim();
                const chinese = parts[1].trim();
                if (english && chinese) {
                    this.customWords.push({ english, chinese });
                }
            }
        });
        
        if (this.customWords.length > 0) {
            this.currentWordSet = [...this.customWords];
            localStorage.setItem('customWords', JSON.stringify(this.customWords));
            alert('Custom words saved successfully!');
        } else {
            alert('Please enter valid word pairs (format: word:translation)');
        }
    }
    
    useDefaultWords() {
        this.currentWordSet = [...this.defaultWords];
        localStorage.removeItem('customWords');
        document.getElementById('custom-words').value = '';
        alert('Using default word set!');
    }
    
    displayVersion() {
        // Updated version info based on current commit
        const versionInfo = {
            date: '2026-03-28',
            hash: '006940e',
            shortHash: '006940e'
        };
        
        // Format the version display
        const versionText = `v${versionInfo.date} (${versionInfo.shortHash})`;
        const versionElement = document.getElementById('version');
        if (versionElement) {
            versionElement.textContent = versionText;
        }
    }
    
    selectWordSet(wordSetType) {
        let newWordSet;
        
        switch(wordSetType) {
            case 'personality':
                newWordSet = this.getPersonalityWords();
                break;
            case 'random':
                newWordSet = this.getRandomMixWords();
                break;
            case 'default':
            default:
                newWordSet = this.getDefaultWords();
                break;
        }
        
        this.currentWordSet = [...newWordSet];
        this.customWords = []; // Clear custom words when using preset
        
        // Save the selection
        localStorage.setItem('selectedWordSet', wordSetType);
        localStorage.removeItem('customWords');
        
        // If game is running, update the target word
        if (this.gameRunning) {
            this.selectNewTargetWord();
        }
        
        // Show confirmation
        const wordSetNames = {
            'default': 'Default Words',
            'personality': 'Personality Adjectives',
            'random': 'Random Mix'
        };
        alert(`Word set changed to: ${wordSetNames[wordSetType]}`);
    }
    
    loadSettings() {
        // Load selected word set
        const selectedWordSet = localStorage.getItem('selectedWordSet');
        if (selectedWordSet) {
            // Set the radio button
            const radio = document.querySelector(`input[name="word-set"][value="${selectedWordSet}"]`);
            if (radio) {
                radio.checked = true;
            }
            
            // Load the appropriate word set
            switch(selectedWordSet) {
                case 'personality':
                    this.currentWordSet = this.getPersonalityWords();
                    break;
                case 'random':
                    this.currentWordSet = this.getRandomMixWords();
                    break;
                case 'default':
                default:
                    this.currentWordSet = this.getDefaultWords();
                    break;
            }
        } else {
            // Load custom words from localStorage (legacy)
            const savedWords = localStorage.getItem('customWords');
            if (savedWords) {
                try {
                    this.customWords = JSON.parse(savedWords);
                    this.currentWordSet = [...this.customWords];
                    
                    // Update textarea
                    const textarea = document.getElementById('custom-words');
                    textarea.value = this.customWords.map(word => `${word.english}:${word.chinese}`).join('\n');
                } catch (e) {
                    console.error('Failed to load custom words:', e);
                    // Fallback to default
                    this.currentWordSet = this.getDefaultWords();
                }
            } else {
                // Use default words
                this.currentWordSet = this.getDefaultWords();
            }
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new GhostWordGame();
});
