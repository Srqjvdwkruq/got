// Import bot classes
import { BotRack, ScrabbleBot } from './scrabbleBot.js';

// Game Configuration
const GRID_SIZE = 15; // ตาราง Scrabble 15x15
const RACK_SIZE = 7; // จำนวนตัวอักษรใน Rack ที่ผู้เล่นมีได้

// คูณคะแนนสำหรับช่องพิเศษ
const BOARD_MULTIPLIERS = {
    TRIPLE_WORD: 'TW',
    DOUBLE_WORD: 'DW',
    TRIPLE_LETTER: 'TL',
    DOUBLE_LETTER: 'DL'
};

// ตำแหน่งของช่องพิเศษบนกระดาน
const SPECIAL_SQUARES = {
    TW: [[0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14]],
    DW: [[1, 1], [1, 13], [2, 2], [2, 12], [3, 3], [3, 11], [4, 4], [4, 10],
         [10, 4], [10, 10], [11, 3], [11, 11], [12, 2], [12, 12], [13, 1], [13, 13]],
    TL: [[1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13], [9, 1], [9, 5],
         [9, 9], [9, 13], [13, 5], [13, 9]],
    DL: [[0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14],
         [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11],
         [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14],
         [12, 6], [12, 8], [14, 3], [14, 11]]
};

// Letter data with scores
export const LETTER_DATA = {
    '' : { score: 0, count: 2 },  // Blank tiles
    'A': { score: 1, count: 9 },
    'B': { score: 3, count: 2 },
    'C': { score: 3, count: 2 },
    'D': { score: 2, count: 4 },
    'E': { score: 1, count: 12 },
    'F': { score: 4, count: 2 },
    'G': { score: 2, count: 3 },
    'H': { score: 4, count: 2 },
    'I': { score: 1, count: 9 },
    'J': { score: 8, count: 1 },
    'K': { score: 5, count: 1 },
    'L': { score: 1, count: 4 },
    'M': { score: 3, count: 2 },
    'N': { score: 1, count: 6 },
    'O': { score: 1, count: 8 },
    'P': { score: 3, count: 2 },
    'Q': { score: 10, count: 1 },
    'R': { score: 1, count: 6 },
    'S': { score: 1, count: 4 },
    'T': { score: 1, count: 6 },
    'U': { score: 1, count: 4 },
    'V': { score: 4, count: 2 },
    'W': { score: 4, count: 2 },
    'X': { score: 8, count: 1 },
    'Y': { score: 4, count: 2 },
    'Z': { score: 10, count: 1 }
};


// ตรวจสอบจำนวนตัวอักษรทั้งหมดใน LETTER_DATA
function validateTileBagTotal() {
    const totalTiles = Object.values(LETTER_DATA).reduce((sum, tile) => sum + tile.count, 0);
    console.log(`Total tiles in bag: ${totalTiles}`);
    if (totalTiles !== 100) {
        console.error('Error: Total tiles do not add up to 100!');
    }
}

// เรียกฟังก์ชันหลังโหลดเอกสาร
document.addEventListener('DOMContentLoaded', () => {
    validateTileBagTotal();
});


class ScrabbleBoard {
    constructor(letterRack) {
        this.boardSize = GRID_SIZE;
        this.letterRack = letterRack;
        this.createBoard();
        this.setupDragAndDrop();
    }

    createBoard() {
        const grid = document.querySelector('.scrabble-grid');
        if (!grid) return;

        // ล้างตารางเก่าถ้ามี
        grid.innerHTML = '';

        // สร้างเซลล์ใหม่
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.cellId = `cell-${i}-${j}`; // เพิ่ม cell id

                // ตั้งค่าช่องพิเศษ
                this.setSpecialCell(cell, i, j);

                grid.appendChild(cell);
            }
        }
    }

    setSpecialCell(cell, row, col) {
        // ตำแหน่งกลาง
        if (row === 7 && col === 7) {
            cell.classList.add('start');
            const star = document.createElement('i');
            star.className = 'fa-solid fa-star';
            cell.appendChild(star);
            return;
        }

        // ตั้งค่าช่องพิเศษอื่นๆ
        if (SPECIAL_SQUARES.TW.some(([r, c]) => r === row && c === col)) {
            cell.classList.add('tw');
            cell.dataset.multiplier = 'TW';
        }
        else if (SPECIAL_SQUARES.DW.some(([r, c]) => r === row && c === col)) {
            cell.classList.add('dw');
            cell.dataset.multiplier = 'DW';
        }
        else if (SPECIAL_SQUARES.TL.some(([r, c]) => r === row && c === col)) {
            cell.classList.add('tl');
            cell.dataset.multiplier = 'TL';
        }
        else if (SPECIAL_SQUARES.DL.some(([r, c]) => r === row && c === col)) {
            cell.classList.add('dl');
            cell.dataset.multiplier = 'DL';
        }
    }

    setupDragAndDrop() {
        const cells = document.querySelectorAll('.scrabble-grid .cell');
        
        cells.forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('drag-over');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                const letter = e.dataTransfer.getData('text');
                const sourceId = e.dataTransfer.getData('sourceId');
                const sourceTile = document.getElementById(sourceId);
                const sourceCell = sourceTile ? sourceTile.closest('.cell') : null;
                
                // ตรวจสอบว่าเซลล์ว่างหรือไม่
                if (!cell.querySelector('.tile')) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = letter;
                    tile.draggable = true;
                    tile.id = 'tile-' + Date.now();
                    
                    // เพิ่ม dragstart event สำหรับการย้ายตัวอักษร
                    tile.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text', letter);
                        e.dataTransfer.setData('sourceId', tile.id);
                    });
                    
                    // ถ้าเป็นช่องเริ่มต้น ให้ลบไอคอนดาวออกก่อน
                    const star = cell.querySelector('.fa-star');
                    if (star) {
                        star.remove();
                    }
                    
                    cell.appendChild(tile);
                    
                    // ถ้าเป็นการย้ายจากช่องอื่นบนบอร์ด
                    if (sourceCell) {
                        // ลบตัวอักษรจากช่องเดิม
                        this.letterRack.placedLetters.delete(sourceCell.dataset.cellId);
                        sourceTile.remove();
                    }
                    
                    // เก็บข้อมูลตัวอักษรที่วางในช่องใหม่
                    this.letterRack.placedLetters.set(cell.dataset.cellId, letter);
                    this.letterRack.updateButtonState();
                }
            });
        });
    }
}

class LetterRack {
    constructor() {
        this.rack = document.getElementById('letter-rack');
        this.letters = [];
        this.placedLetters = new Map(); // เก็บตัวอักษรที่วางบนบอร์ด
        this.maxLetters = RACK_SIZE;
        this.setupButtons();
        this.fillRack();
        this.updateButtonState();
    }

    setupButtons() {
        const refreshBtn = document.getElementById('refreshBtn');
        const clearBtn = document.getElementById('clearBtn');
        const shuffleBtn = document.getElementById('shuffleBtn');

        refreshBtn.addEventListener('click', () => {
            if (this.placedLetters.size > 0) {
                this.returnLettersToRack();
            } else {
                this.refreshLetters();
            }
        });
        clearBtn.addEventListener('click', () => this.clearRack());
        shuffleBtn.addEventListener('click', () => this.shuffleLetters());
    }

    createLetterTile(letter) {
        const tile = document.createElement('span');
        tile.className = 'letter-tile';
        tile.draggable = true;
        tile.id = 'rack-tile-' + Date.now();
        tile.dataset.letter = letter;
    
        // เพิ่มตัวอักษร
        const letterContent = document.createElement('span');
        letterContent.className = 'letter-content';
        letterContent.textContent = letter;
    
        // เพิ่มคะแนน
        const score = document.createElement('span');
        score.className = 'letter-score';
        score.textContent = LETTER_DATA[letter]?.score || 0;
    
        // เพิ่มเนื้อหาใน tile
        tile.appendChild(letterContent);
        tile.appendChild(score);
    
        // Drag events
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text', letter);
            e.dataTransfer.setData('sourceId', tile.id);
            tile.classList.add('dragging');
        });
    
        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
        });
    
        return tile;
    }

    getRandomLetter() {
        // ตรวจสอบจำนวนตัวอักษรที่เหลือทั้งหมด
        const totalAvailable = Object.values(LETTER_DATA).reduce((sum, data) => sum + data.count, 0);
        if (totalAvailable === 0) return null;

        const availableLetters = Object.entries(LETTER_DATA)
            .filter(([letter, data]) => data.count > 0)
            .map(([letter]) => letter);
        
        if (availableLetters.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        const letter = availableLetters[randomIndex];
        LETTER_DATA[letter].count--;
        updateTileBagCounts();
        return letter;
    }

    fillRack() {
        // ตรวจสอบว่าต้องการตัวอักษรเพิ่มกี่ตัว
        const neededLetters = this.maxLetters - this.letters.length;
        
        // ตรวจสอบจำนวนตัวอักษรที่เหลือทั้งหมด
        const totalAvailable = Object.values(LETTER_DATA).reduce((sum, data) => sum + data.count, 0);
        
        // ถ้าตัวอักษรไม่พอ ให้ใช้เท่าที่มี
        const lettersToAdd = Math.min(neededLetters, totalAvailable);
        
        for (let i = 0; i < lettersToAdd; i++) {
            const letter = this.getRandomLetter();
            if (!letter) break;
            this.letters.push(letter);
        }
        
        this.updateRackDisplay();
        updateTileBagCounts();
    }

    refreshLetters() {
        // Return letters to the bag
        this.letters.forEach(letter => {
            if (LETTER_DATA[letter]) {
                LETTER_DATA[letter].count++;
            }
        });
        
        // Clear and refill
        this.letters = [];
        this.fillRack();
        updateTileBagCounts();
    }

    returnLettersToRack() {
        // Return placed letters to rack
        this.placedLetters.forEach((cellId, letter) => {
            this.letters.push(letter);
            const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
            if (cell) {
                cell.textContent = '';
                cell.classList.remove('filled');
            }
        });
        this.placedLetters.clear();
        this.updateRackDisplay();
        updateTileBagCounts();
    }

    clearRack() {
        // Return letters to the bag before clearing
        this.letters.forEach(letter => {
            if (LETTER_DATA[letter]) {
                LETTER_DATA[letter].count++;
            }
        });
        this.letters = [];
        this.updateRackDisplay();
        updateTileBagCounts();
    }

    updateRackDisplay() {
        this.rack.innerHTML = '';
        // แสดงเฉพาะ 7 ตัวแรก
        this.letters.slice(0, this.maxLetters).forEach(letter => {
            const tile = this.createLetterTile(letter);
            this.rack.appendChild(tile);
        });
    }

    shuffleLetters() {
        // สลับตำแหน่งตัวอักษร
        for (let i = this.letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.letters[i], this.letters[j]] = [this.letters[j], this.letters[i]];
        }
        // อัพเดทการแสดงผล
        this.updateRackDisplay();
    }

    updateButtonState() {
        const refreshBtn = document.getElementById('refreshBtn');
        const icon = refreshBtn.querySelector('i');
        if (this.placedLetters.size > 0) {
            icon.className = 'fa-solid fa-arrows-down-to-line'; // เปลี่ยนเป็นไอคอน undo
            refreshBtn.title = 'Return letters to rack';
            refreshBtn.setAttribute('aria-label', 'Return Letters to Rack');
        } else {
            icon.className = 'fa-solid fa-arrows-rotate'; // เปลี่ยนกลับเป็นไอคอน refresh
            refreshBtn.title = 'Refresh letters';
            refreshBtn.setAttribute('aria-label', 'Refresh Letters');
        }
    }
}

class GameControls {
    constructor(letterRack) {
        this.letterRack = letterRack;
        this.setupActionButtons();
    }

    setupActionButtons() {
        const resignBtn = document.getElementById('resignBtn');
        const skipBtn = document.getElementById('skipBtn');
        const swapBtn = document.getElementById('swapBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        // เพิ่ม event listeners
        resignBtn.addEventListener('click', () => this.handleResign());
        skipBtn.addEventListener('click', () => this.handleSkipTurn());
        swapBtn.addEventListener('click', () => this.handleSwap());
        submitBtn.addEventListener('click', () => this.handleSubmit());
    }
        

        handleResign() {
            showConfirmBox('Are you sure you want to resign?', () => {
                window.location.href = '../index.html';
                }, () => {
                    console.log('Resign canceled');
                }
            );
        }
    
        handleSkipTurn() {
            showConfirmBox('Are you sure you want to skip your turn?', () => {
                console.log('Skip turn');
            })
        }

        handleSwap() {
            const modal = document.getElementById('swapModal');
            const container = document.getElementById('swapLettersContainer');
            const swapBtn = document.getElementById('swapSelectedBtn');
            const cancelBtn = document.getElementById('cancelSwapBtn');
            let selectedLetters = new Set();

            container.innerHTML = '';
            this.letterRack.letters.forEach((letter, index) => {
                const letterDiv = document.createElement('div');
                letterDiv.className = 'swap-letter';
                letterDiv.textContent = letter;
                letterDiv.dataset.index = index;

                const score = document.createElement('span');
                score.className = 'letter-score';
                score.textContent = LETTER_DATA[letter]?.score || '0';
                letterDiv.appendChild(score);

                letterDiv.addEventListener('click', () => {
                    letterDiv.classList.toggle('selected');
                    if (selectedLetters.has(index)) {
                        selectedLetters.delete(index);
                    } else {
                        selectedLetters.add(index);
                    }
                    swapBtn.disabled = selectedLetters.size === 0;
                });

                container.appendChild(letterDiv);
            });

            const handleSwap = () => {
                if (selectedLetters.size === 0) return;

                modal.style.display = 'none';
                showConfirmBox(`Swap ${selectedLetters.size} letters?`, () => {
                    const indices = Array.from(selectedLetters).sort((a, b) => b - a);
                    indices.forEach(i => {
                        this.letterRack.letters.splice(i, 1);
                    });

                    for (let i = 0; i < indices.length; i++) {
                        const letter = this.getRandomLetter();
                        if (letter) this.letterRack.letters.push(letter);
                    }

                    this.letterRack.updateRackDisplay();
                    updateTileBagCounts();
                    selectedLetters.clear();
                });
            };

            const handleCancel = () => {
                modal.style.display = 'none';
                selectedLetters.clear();
                container.innerHTML = '';
            };

            swapBtn.addEventListener('click', handleSwap);
            cancelBtn.addEventListener('click', handleCancel);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleCancel();
            });

            modal.style.display = 'block';
        }

        handleSubmit() {
            // TODO: Implement submit functionality
        }

        // Helper method to get random letter
        getRandomLetter() {
            const availableLetters = [];
            Object.entries(LETTER_DATA).forEach(([letter, data]) => {
                if (data.count > 0) {
                    for (let j = 0; j < data.count; j++) {
                        availableLetters.push(letter);
                    }
                }
            });

            if (availableLetters.length === 0) return null;

            const randomIndex = Math.floor(Math.random() * availableLetters.length);
            const letter = availableLetters[randomIndex];
            LETTER_DATA[letter].count--;
            return letter;
        }
}

// อัพเดตจำนวนตัวอักษรใน Tile Bag
export function updateTileBagCounts() {
    const availableLettersDiv = document.getElementById('available-letters');
    const vowelsCount = document.getElementById('vowelsCount');
    const consonantsCount = document.getElementById('consonantsCount');
    const totalTilesElement = document.getElementById('totalTiles');

    let vowels = 0;
    let consonants = 0;
    let total = 0;

    let lettersHTML = '';
    for (const [letter, data] of Object.entries(LETTER_DATA)) {
        const displayLetter = letter === '' ? '?' : letter;
        total += data.count;

        if ('AEIOU'.includes(letter)) {
            vowels += data.count;
        } else if (letter !== '') {
            consonants += data.count;
        }

        lettersHTML += `
            <div class="letter-count">
                <span class="letter">${displayLetter}=${data.count}</span>
            </div>
        `;
    }
    
    if (vowelsCount) vowelsCount.textContent = vowels;
    if (consonantsCount) consonantsCount.textContent = consonants;
    if (totalTilesElement) totalTilesElement.textContent = total;
    if (availableLettersDiv) availableLettersDiv.innerHTML = lettersHTML;
    
    console.log('Updated tile counts - Total:', total, 'Vowels:', vowels, 'Consonants:', consonants);
}

// Initialize letter counts at game start
function initializeLetterData() {
    // เก็บค่าเริ่มต้นของตัวอักษรแต่ละตัว
    const initialLetterData = { ...LETTER_DATA };
    
    // รีเซ็ตค่าตัวอักษรทั้งหมด
    Object.keys(LETTER_DATA).forEach(letter => {
        LETTER_DATA[letter].count = initialLetterData[letter].count;
    });
    
    updateTileBagCounts();
}

// Initialize Scrabble Game
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('scrabble_cw.html')) {
        // รีเซ็ตข้อมูลตัวอักษรก่อน
        initializeLetterData();
        
        // Initialize game components
        const letterRack = new LetterRack();
        const board = new ScrabbleBoard(letterRack);
        const controls = new GameControls(letterRack);

        // Initialize bot
        const botRack = new BotRack();
        const bot = new ScrabbleBot(board);

        // Update tile bag display
        updateTileBagCounts();
    }
});