// 游戏配置
const ROWS = 20;
const COLS = 10;
const PREVIEW_SIZE = 4;
const LINES_PER_LEVEL = 10;
const COMBO_TIMEOUT = 3000;

// 分数表
const SCORE_TABLE = {
    1: 100,
    2: 300,
    3: 600,
    4: 1000
};

// 连击奖励表
const COMBO_BONUS = {
    2: 50,
    3: 100,
    4: 200
};

// 主题配置
const THEMES = {
    classic: {
        bg: '#1a1a2e',
        gridBg: '#0f0f1a',
        gridLine: '#2a2a3e',
        text: '#ffffff',
        accent: '#00f0f0'
    },
    neon: {
        bg: '#0a0a1a',
        gridBg: '#0f0f1a',
        gridLine: '#1a1a3e',
        text: '#ffffff',
        accent: '#00ffff'
    },
    monochrome: {
        bg: '#f5f5f5',
        gridBg: '#e8e8e8',
        gridLine: '#dddddd',
        text: '#333333',
        accent: '#666666'
    }
};

// 七种方块的形状定义
const SHAPES = {
    1: [
        [[0, 1], [1, 1], [2, 1], [3, 1]],
        [[2, 0], [2, 1], [2, 2], [2, 3]],
        [[0, 2], [1, 2], [2, 2], [3, 2]],
        [[1, 0], [1, 1], [1, 2], [1, 3]]
    ],
    2: [
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]]
    ],
    3: [
        [[1, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [1, 1], [2, 1], [1, 2]],
        [[0, 1], [1, 1], [2, 1], [1, 2]],
        [[1, 0], [0, 1], [1, 1], [1, 2]]
    ],
    4: [
        [[1, 0], [2, 0], [0, 1], [1, 1]],
        [[1, 0], [1, 1], [2, 1], [2, 2]],
        [[1, 1], [2, 1], [0, 2], [1, 2]],
        [[0, 0], [0, 1], [1, 1], [1, 2]]
    ],
    5: [
        [[0, 0], [1, 0], [1, 1], [2, 1]],
        [[2, 0], [1, 1], [2, 1], [1, 2]],
        [[0, 1], [1, 1], [1, 2], [2, 2]],
        [[1, 0], [0, 1], [1, 1], [0, 2]]
    ],
    6: [
        [[0, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [1, 2]],
        [[0, 1], [1, 1], [2, 1], [2, 2]],
        [[1, 0], [1, 1], [0, 2], [1, 2]]
    ],
    7: [
        [[2, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [1, 1], [1, 2], [2, 2]],
        [[0, 1], [1, 1], [2, 1], [0, 2]],
        [[0, 0], [1, 0], [1, 1], [1, 2]]
    ]
};

// 游戏状态
let grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;
let gameState = 'waiting';
let dropInterval = null;

// 游戏统计
let stats = {
    score: 0,
    level: 1,
    lines: 0,
    combo: 0,
    lastClearTime: 0
};

// 最高分
let highScore = { score: 0, date: null };

// 游戏设置
let settings = {
    theme: 'classic',
    soundEnabled: true
};

// 音频上下文
let audioContext = null;

// DOM 元素
const gameBoard = document.getElementById('gameBoard');
const previewGrid = document.getElementById('previewGrid');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const highScoreElement = document.getElementById('highScore');
const messageElement = document.getElementById('message');
const pauseOverlay = document.getElementById('pauseOverlay');
const soundBtn = document.getElementById('soundBtn');

// 初始化游戏
function initGame() {
    loadSettings();
    loadHighScore();
    initAudio();
    applyTheme();
    createGrid();
    createPreviewGrid();
    updateStats();
    render();
    setupEventListeners();
}

// 初始化音频
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('音频不支持');
    }
}

// 播放音效
function playSound(frequency, duration, type = 'square') {
    if (!settings.soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// 各种音效
const SOUNDS = {
    move: () => playSound(200, 0.05),
    rotate: () => playSound(400, 0.08),
    lock: () => playSound(150, 0.1),
    clear: (lines) => playSound(300 + lines * 100, 0.2),
    combo: () => [523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.1), i * 50)),
    levelUp: () => playSound(600, 0.3),
    gameOver: () => playSound(150, 0.5)
};

// 加载设置
function loadSettings() {
    const saved = localStorage.getItem('tetrisSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    updateSoundButton();
    updateThemeButtons();
}

// 保存设置
function saveSettings() {
    localStorage.setItem('tetrisSettings', JSON.stringify(settings));
}

// 加载最高分
function loadHighScore() {
    const saved = localStorage.getItem('tetrisHighScore');
    if (saved) {
        highScore = JSON.parse(saved);
        highScoreElement.textContent = highScore.score;
    }
}

// 保存最高分
function saveHighScore() {
    localStorage.setItem('tetrisHighScore', JSON.stringify(highScore));
}

// 检查最高分
function checkHighScore() {
    if (stats.score > highScore.score) {
        highScore.score = stats.score;
        highScore.date = new Date().toLocaleDateString();
        saveHighScore();
        highScoreElement.textContent = highScore.score;
        return true;
    }
    return false;
}

// 应用主题
function applyTheme() {
    const theme = THEMES[settings.theme];
    document.documentElement.style.setProperty('--bg-color', theme.bg);
    document.documentElement.style.setProperty('--grid-bg', theme.gridBg);
    document.documentElement.style.setProperty('--grid-line', theme.gridLine);
    document.documentElement.style.setProperty('--text-color', theme.text);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    
    document.body.className = `theme-${settings.theme}`;
}

// 切换主题
function switchTheme(themeName) {
    settings.theme = themeName;
    applyTheme();
    saveSettings();
    updateThemeButtons();
}

// 更新主题按钮状态
function updateThemeButtons() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
}

// 切换音效
function toggleSound() {
    settings.soundEnabled = !settings.soundEnabled;
    updateSoundButton();
    saveSettings();
}

// 更新音效按钮
function updateSoundButton() {
    soundBtn.textContent = settings.soundEnabled ? '开' : '关';
}

// 创建游戏网格
function createGrid() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < ROWS * COLS; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        gameBoard.appendChild(cell);
    }
}

// 创建预览网格
function createPreviewGrid() {
    previewGrid.innerHTML = '';
    for (let i = 0; i < PREVIEW_SIZE * PREVIEW_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'preview-cell';
        previewGrid.appendChild(cell);
    }
}

// 生成随机方块
function generateRandomPiece() {
    return Math.floor(Math.random() * 7) + 1;
}

// 开始游戏
function startGame() {
    grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    stats = { score: 0, level: 1, lines: 0, combo: 0, lastClearTime: 0 };
    nextPiece = null;
    
    updateStats();
    gameState = 'playing';
    messageElement.textContent = '';
    messageElement.classList.remove('new-record');
    
    spawnPiece();
    restartGameLoop();
}

// 生成新方块
function spawnPiece() {
    if (nextPiece === null) {
        nextPiece = generateRandomPiece();
    }
    
    currentPiece = {
        type: nextPiece,
        x: 3,
        y: 0,
        rotation: 0
    };
    
    nextPiece = generateRandomPiece();
    renderNextPiece();
    
    if (checkCollision(currentPiece, currentPiece.x, currentPiece.y, currentPiece.rotation)) {
        gameOver();
    }
}

// 碰撞检测
function checkCollision(piece, x, y, rotation) {
    const shape = SHAPES[piece.type][rotation];
    for (let [dx, dy] of shape) {
        const newX = x + dx;
        const newY = y + dy;
        
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
        }
        
        if (newY >= 0 && grid[newY][newX] !== 0) {
            return true;
        }
    }
    return false;
}

// 获取幽灵位置
function getGhostPosition() {
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece, currentPiece.x, ghostY + 1, currentPiece.rotation)) {
        ghostY++;
    }
    return { x: currentPiece.x, y: ghostY };
}

// 移动方块
function movePiece(dx, dy) {
    if (gameState !== 'playing') return false;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (!checkCollision(currentPiece, newX, newY, currentPiece.rotation)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        if (dx !== 0) SOUNDS.move();
        render();
        return true;
    }
    
    if (dy > 0) {
        SOUNDS.lock();
        lockPiece();
        const cleared = clearLines();
        if (cleared > 0) {
            handleClearLines(cleared);
        } else {
            stats.combo = 0;
        }
        spawnPiece();
    }
    
    return false;
}

// 处理消行
function handleClearLines(cleared) {
    SOUNDS.clear(cleared);
    
    // 检查连击
    const now = Date.now();
    if (now - stats.lastClearTime < COMBO_TIMEOUT) {
        stats.combo++;
        if (stats.combo >= 2) {
            SOUNDS.combo();
            showComboMessage(stats.combo);
        }
    } else {
        stats.combo = 1;
    }
    stats.lastClearTime = now;
    
    // 计算分数
    let points = calculateScore(cleared);
    const comboBonus = getComboBonus();
    points += comboBonus;
    
    stats.score += points;
    stats.lines += cleared;
    updateLevel();
    updateStats();
}

// 计算连击奖励
function getComboBonus() {
    return COMBO_BONUS[stats.combo] || (stats.combo >= 5 ? 300 : 0);
}

// 显示连击消息
function showComboMessage(combo) {
    const msg = document.createElement('div');
    msg.className = 'combo-message';
    msg.textContent = `×${combo} COMBO!`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1000);
}

// 旋转方块
function rotatePiece() {
    if (gameState !== 'playing') return;
    
    const newRotation = (currentPiece.rotation + 1) % 4;
    
    if (!checkCollision(currentPiece, currentPiece.x, currentPiece.y, newRotation)) {
        currentPiece.rotation = newRotation;
        SOUNDS.rotate();
        render();
    }
}

// 快速下落
function hardDrop() {
    if (gameState !== 'playing') return;
    
    while (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.rotation)) {
        currentPiece.y++;
    }
    
    SOUNDS.lock();
    lockPiece();
    const cleared = clearLines();
    if (cleared > 0) {
        handleClearLines(cleared);
    } else {
        stats.combo = 0;
    }
    
    spawnPiece();
    render();
}

// 锁定方块
function lockPiece() {
    const shape = SHAPES[currentPiece.type][currentPiece.rotation];
    for (let [dx, dy] of shape) {
        const x = currentPiece.x + dx;
        const y = currentPiece.y + dy;
        if (y >= 0) {
            grid[y][x] = currentPiece.type;
        }
    }
}

// 消除满行
function clearLines() {
    let clearedCount = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        const isFull = grid[y].every(cell => cell !== 0);
        
        if (isFull) {
            grid.splice(y, 1);
            grid.unshift(Array(COLS).fill(0));
            clearedCount++;
            y++;
        }
    }
    
    return clearedCount;
}

// 计算得分
function calculateScore(clearedLines) {
    if (clearedLines === 0) return 0;
    const baseScore = SCORE_TABLE[clearedLines] || 0;
    return baseScore * stats.level;
}

// 更新等级
function updateLevel() {
    const newLevel = Math.floor(stats.lines / LINES_PER_LEVEL) + 1;
    if (newLevel > stats.level) {
        stats.level = newLevel;
        SOUNDS.levelUp();
        showMessage(`等级提升！Lv.${stats.level}`);
        restartGameLoop();
    }
}

// 获取下落间隔
function getDropInterval() {
    const interval = 1000 - (stats.level - 1) * 150;
    return Math.max(200, interval);
}

// 显示消息
function showMessage(text) {
    messageElement.textContent = text;
    setTimeout(() => {
        if (gameState === 'playing') {
            messageElement.textContent = '';
        }
    }, 2000);
}

// 更新统计
function updateStats() {
    scoreElement.textContent = stats.score;
    levelElement.textContent = stats.level;
    linesElement.textContent = stats.lines;
}

// 暂停/继续
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        stopGameLoop();
        pauseOverlay.classList.add('active');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseOverlay.classList.remove('active');
        restartGameLoop();
    }
}

// 游戏结束
function gameOver() {
    gameState = 'gameover';
    stopGameLoop();
    SOUNDS.gameOver();
    
    const isNewRecord = checkHighScore();
    if (isNewRecord) {
        messageElement.classList.add('new-record');
    }
    
    messageElement.textContent = `游戏结束！分数:${stats.score} 等级:${stats.level} 行数:${stats.lines}${isNewRecord ? ' 新纪录！' : ''}，按空格重新开始`;
}

// 游戏循环
function gameLoop() {
    if (gameState === 'playing') {
        movePiece(0, 1);
    }
}

// 启动游戏循环
function startGameLoop() {
    const interval = getDropInterval();
    dropInterval = setInterval(gameLoop, interval);
}

// 停止游戏循环
function stopGameLoop() {
    if (dropInterval) {
        clearInterval(dropInterval);
        dropInterval = null;
    }
}

// 重启游戏循环
function restartGameLoop() {
    stopGameLoop();
    startGameLoop();
}

// 渲染游戏
function render() {
    const cells = gameBoard.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        cell.className = 'cell';
    });
    
    // 渲染已锁定的方块
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] !== 0) {
                const index = y * COLS + x;
                cells[index].classList.add(`type-${grid[y][x]}`);
            }
        }
    }
    
    // 渲染幽灵方块
    if (currentPiece && gameState === 'playing') {
        const ghost = getGhostPosition();
        const shape = SHAPES[currentPiece.type][currentPiece.rotation];
        for (let [dx, dy] of shape) {
            const x = ghost.x + dx;
            const y = ghost.y + dy;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                const index = y * COLS + x;
                if (!cells[index].classList.contains(`type-${currentPiece.type}`)) {
                    cells[index].classList.add(`type-${currentPiece.type}`, 'ghost');
                }
            }
        }
    }
    
    // 渲染当前方块
    if (currentPiece && gameState === 'playing') {
        const shape = SHAPES[currentPiece.type][currentPiece.rotation];
        for (let [dx, dy] of shape) {
            const x = currentPiece.x + dx;
            const y = currentPiece.y + dy;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                const index = y * COLS + x;
                cells[index].className = `cell type-${currentPiece.type}`;
            }
        }
    }
}

// 渲染下一个方块
function renderNextPiece() {
    const cells = previewGrid.querySelectorAll('.preview-cell');
    
    cells.forEach(cell => {
        cell.className = 'preview-cell';
    });
    
    if (nextPiece === null) return;
    
    const shape = SHAPES[nextPiece][0];
    for (let [dx, dy] of shape) {
        const x = dx;
        const y = dy;
        if (y >= 0 && y < PREVIEW_SIZE && x >= 0 && x < PREVIEW_SIZE) {
            const index = y * PREVIEW_SIZE + x;
            if (cells[index]) {
                cells[index].classList.add(`type-${nextPiece}`);
            }
        }
    }
}

// 设置事件监听
function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTheme(btn.dataset.theme));
    });
    
    soundBtn.addEventListener('click', toggleSound);
}

// 键盘事件处理
function handleKeyDown(e) {
    if (gameState === 'waiting' || gameState === 'gameover') {
        if (e.code === 'Space') {
            e.preventDefault();
            startGame();
        }
        return;
    }
    
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
    }
    
    if (gameState === 'paused') {
        if (e.code !== 'Space') {
            togglePause();
        }
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
}

// 启动游戏
initGame();
