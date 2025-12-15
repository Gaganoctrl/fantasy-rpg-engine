// ============= GAME STATE MANAGEMENT =============
let gameState = {
    currentScreen: 'menu',
    player: null,
    currentLocation: 'village',
    inCombat: false,
    currentEnemy: null,
    gameLog: []
};

const classStats = {
    warrior: { hp: 120, mp: 30, str: 18, dex: 10, con: 16, int: 8, wis: 10, cha: 11 },
    rogue: { hp: 90, mp: 35, str: 14, dex: 18, con: 12, int: 12, wis: 11, cha: 13 },
    mage: { hp: 70, mp: 80, str: 10, dex: 12, con: 10, int: 16, wis: 14, cha: 12 },
    ranger: { hp: 100, mp: 40, str: 14, dex: 16, con: 13, int: 11, wis: 13, cha: 12 }
};

const enemies = [
    { name: 'Goblin', level: 1, hp: 20, damage: 3, exp: 50, emoji: '🧌' },
    { name: 'Orc', level: 3, hp: 35, damage: 6, exp: 100, emoji: '👹' },
    { name: 'Troll', level: 5, hp: 50, damage: 8, exp: 150, emoji: '👹' },
    { name: 'Dragon', level: 10, hp: 100, damage: 15, exp: 500, emoji: '🐉' },
    { name: 'Skeleton', level: 4, hp: 30, damage: 5, exp: 80, emoji: '💀' }
];

const locations = {
    forest: { name: 'Enchanted Forest', desc: 'A mystical forest full of creatures', enemies: ['Goblin', 'Orc', 'Skeleton'] },
    mountain: { name: 'Mountain Peak', desc: 'A harsh, rocky terrain', enemies: ['Orc', 'Troll', 'Dragon'] },
    cave: { name: 'Dark Cavern', desc: 'An ominous underground cave', enemies: ['Skeleton', 'Troll'] },
    village: { name: 'Starting Village', desc: 'A peaceful village where your adventure begins', enemies: [] }
};

// ============= CHARACTER CLASS =============
class Character {
    constructor(name, classType) {
        this.name = name;
        this.class = classType;
        const stats = classStats[classType];
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.mp = stats.mp;
        this.maxMp = stats.mp;
        this.str = stats.str;
        this.dex = stats.dex;
        this.con = stats.con;
        this.int = stats.int;
        this.wis = stats.wis;
        this.cha = stats.cha;
        this.gold = 100;
        this.items = [];
        this.equipment = {};
    }
    
    takeDamage(damage) {
        const mitigated = Math.max(1, damage - Math.floor(this.con / 5));
        this.hp = Math.max(0, this.hp - mitigated);
        return mitigated;
    }
    
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.exp = 0;
        this.expToLevel = Math.floor(this.expToLevel * 1.15);
        this.maxHp += 10;
        this.maxMp += 5;
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.str += 2;
        this.dex += 1;
        this.con += 1;
        addGameLog(`${this.name} reached level ${this.level}!`);
    }
    
    calculateDamage() {
        const baseDamage = this.str + Math.floor(Math.random() * 10);
        const critChance = Math.min(0.3, this.dex / 100);
        const isCrit = Math.random() < critChance;
        return isCrit ? baseDamage * 1.5 : baseDamage;
    }
}

// ============= GAME LOGIC =============
function startGame() {
    showScreen('character-creation');
}

function selectClass(classType) {
    document.querySelectorAll('.class-card').forEach(card => card.style.borderColor = '#e94560');
    event.target.closest('.class-card').style.borderColor = '#ffd700';
    window.selectedClass = classType;
}

function createCharacter() {
    const name = document.getElementById('char-name').value || 'Hero';
    const classType = window.selectedClass || 'warrior';
    gameState.player = new Character(name, classType);
    gameState.currentScreen = 'game';
    showScreen('game-screen');
    updateUI();
    addGameLog(`Welcome, ${name} the ${classType.toUpperCase()}!`);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function goToLocation(location) {
    gameState.currentLocation = location;
    const loc = locations[location];
    document.getElementById('location-name').textContent = loc.name;
    document.getElementById('location-description').textContent = loc.desc;
    updateUI();
}

function encounterEnemy() {
    if (!gameState.player) return;
    const loc = locations[gameState.currentLocation];
    if (loc.enemies.length === 0) {
        addGameLog('No enemies found in this peaceful location.');
        return;
    }
    const enemyName = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
    const templateEnemy = enemies.find(e => e.name === enemyName);
    gameState.currentEnemy = {
        ...templateEnemy,
        hp: templateEnemy.hp,
        maxHp: templateEnemy.hp
    };
    startCombat();
}

function startCombat() {
    gameState.inCombat = true;
    document.getElementById('combat-area').classList.remove('hidden');
    document.getElementById('exploration-area').classList.add('hidden');
    document.getElementById('player-visual').className = `visual ${gameState.player.class}`;
    document.getElementById('player-visual').textContent = '🧙';
    document.getElementById('enemy-name').textContent = gameState.currentEnemy.name;
    document.getElementById('enemy-visual').textContent = gameState.currentEnemy.emoji;
    document.getElementById('combat-log').innerHTML = `<p>Combat started! Facing ${gameState.currentEnemy.name}...</p>`;
    updateCombatUI();
}

function playerAction(action) {
    if (!gameState.inCombat) return;
    let playerDamage = 0;
    let actionText = '';
    
    switch(action) {
        case 'attack':
            playerDamage = gameState.player.calculateDamage();
            actionText = `${gameState.player.name} attacks for ${Math.floor(playerDamage)} damage!`;
            break;
        case 'skill':
            playerDamage = gameState.player.calculateDamage() * 1.3;
            actionText = `${gameState.player.name} uses special skill for ${Math.floor(playerDamage)} damage!`;
            gameState.player.mp -= 15;
            break;
        case 'defend':
            actionText = `${gameState.player.name} takes a defensive stance!`;
            gameState.player.heal(10);
            break;
        case 'potion':
            actionText = `${gameState.player.name} drinks a potion!`;
            gameState.player.heal(30);
            break;
    }
    
    gameState.currentEnemy.hp -= playerDamage;
    addGameLog(actionText);
    
    if (gameState.currentEnemy.hp <= 0) {
        winCombat();
        return;
    }
    
    // Enemy turn
    setTimeout(() => {
        const enemyDamage = gameState.currentEnemy.damage + Math.floor(Math.random() * 5);
        const playerDamageTaken = gameState.player.takeDamage(enemyDamage);
        addGameLog(`${gameState.currentEnemy.name} attacks for ${playerDamageTaken} damage!`);
        
        if (gameState.player.hp <= 0) {
            loseCombat();
        } else {
            updateCombatUI();
        }
    }, 500);
}

function winCombat() {
    addGameLog(`${gameState.currentEnemy.name} defeated!`);
    gameState.player.gainExp(gameState.currentEnemy.exp);
    gameState.player.gold += gameState.currentEnemy.level * 10;
    addGameLog(`Gained ${gameState.currentEnemy.exp} experience and ${gameState.currentEnemy.level * 10} gold!`);
    endCombat();
}

function loseCombat() {
    addGameLog(`${gameState.player.name} was defeated! Restarting...`);
    gameState.player.hp = gameState.player.maxHp;
    setTimeout(() => endCombat(), 2000);
}

function endCombat() {
    gameState.inCombat = false;
    document.getElementById('combat-area').classList.add('hidden');
    document.getElementById('exploration-area').classList.remove('hidden');
    updateUI();
}

function restAtInn() {
    if (!gameState.player) return;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    addGameLog('You rest at the inn and restore all health and mana.');
    updateUI();
}

function openInventory() {
    addGameLog(`Inventory: ${gameState.player.items.length > 0 ? gameState.player.items.join(', ') : 'Empty'}`);
}

function addGameLog(message) {
    gameState.gameLog.push(message);
    const logElement = document.getElementById('combat-log');
    if (logElement) {
        logElement.innerHTML += `<p>${message}</p>`;
        logElement.scrollTop = logElement.scrollHeight;
    }
}

function updateUI() {
    if (!gameState.player) return;
    document.getElementById('player-name').textContent = gameState.player.name;
    document.getElementById('hp-text').textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
    document.getElementById('mp-text').textContent = `${gameState.player.mp}/${gameState.player.maxMp}`;
    document.getElementById('level-text').textContent = gameState.player.level;
    document.getElementById('hp-fill').style.width = `${(gameState.player.hp / gameState.player.maxHp) * 100}%`;
    document.getElementById('mp-fill').style.width = `${(gameState.player.mp / gameState.player.maxMp) * 100}%`;
    document.getElementById('exp-fill').style.width = `${(gameState.player.exp / gameState.player.expToLevel) * 100}%`;
    document.getElementById('stat-str').textContent = gameState.player.str;
    document.getElementById('stat-dex').textContent = gameState.player.dex;
    document.getElementById('stat-con').textContent = gameState.player.con;
    document.getElementById('stat-int').textContent = gameState.player.int;
}

function updateCombatUI() {
    if (!gameState.player || !gameState.currentEnemy) return;
    const playerHpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
    const enemyHpPercent = (gameState.currentEnemy.hp / gameState.currentEnemy.maxHp) * 100;
    document.getElementById('player-hp-bar').style.width = `${playerHpPercent}%`;
    document.getElementById('enemy-hp-bar').style.width = `${enemyHpPercent}%`;
    updateUI();
}

function loadGame() {
    addGameLog('Load game functionality coming soon!');
}

function showSettings() {
    addGameLog('Settings functionality coming soon!');
}
