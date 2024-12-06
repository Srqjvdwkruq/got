// 1. Imports
import { BotRack, ScrabbleBot } from './scrabbleBot.js';

// 2. Constants
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

// ข้อมูลตัวอักษร คะแนนและจำนวน
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

function showConfirmBox(message, onConfirm, onCancel) {
    const confirmBox = document.getElementById('confirmBox');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    if (!confirmBox || !confirmMessage || !confirmYes || !confirmNo) {
        console.error('Confirmation box elements not found');
        return;
    }

    confirmMessage.textContent = message;
    confirmBox.style.display = 'flex';

    // Remove existing listeners
    const newConfirmYes = confirmYes.cloneNode(true);
    const newConfirmNo = confirmNo.cloneNode(true);
    confirmYes.parentNode.replaceChild(newConfirmYes, confirmYes);
    confirmNo.parentNode.replaceChild(newConfirmNo, confirmNo);

    // Add new listeners
    newConfirmYes.addEventListener('click', () => {
        confirmBox.style.display = 'none';
        if (onConfirm) onConfirm();
    });

    newConfirmNo.addEventListener('click', () => {
        confirmBox.style.display = 'none';
        if (onCancel) onCancel();
    });
}

function validateTileBagTotal() {
    const totalTiles = Object.values(LETTER_DATA).reduce((sum, tile) => sum + tile.count, 0);
    console.log(`Total tiles in bag: ${totalTiles}`);
    if (totalTiles !== 100) {
        console.error('Error: Total tiles do not add up to 100!');
    }
}

function validateGameStart() {
    const totalLetters = Object.values(LETTER_DATA)
        .reduce((sum, {count}) => sum + count, 0);
    
    if (totalLetters !== 100) {
        console.error('Invalid letter count, resetting game...');
        resetLetterData();
        return false;
    }
    return true;
}

function validateLetterAvailability() {
    const totalLetters = Object.values(LETTER_DATA)
        .reduce((sum, {count}) => sum + count, 0);
    
    if (totalLetters < 14) { // ต้องมีพอสำหรับทั้ง player และ bot
        console.error(`Not enough letters available: ${totalLetters}`);
        return false;
    }
    return true;
}

export function resetLetterData() {
    try {
        const originalData = JSON.parse(JSON.stringify(LETTER_DATA));
        Object.keys(LETTER_DATA).forEach(letter => {
            LETTER_DATA[letter].count = originalData[letter].count;
        });
        console.log('Letter data has been reset');
        validateTileBagTotal();
    } catch (error) {
        console.error('Error resetting letter data:', error);
    }
}

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

function initializeLetterData() {
    // เก็บค่าเริ่มต้นของตัวอักษรแต่ละตัว
    const initialLetterData = { ...LETTER_DATA };
    
    // รีเซ็ตค่าตัวอักษรทั้งหมด
    Object.keys(LETTER_DATA).forEach(letter => {
        LETTER_DATA[letter].count = initialLetterData[letter].count;
    });
    
    updateTileBagCounts();
}

function cleanupGame() {
    if (window.location.pathname.includes('scrabble_cw.html')) {
        resetLetterData();
        updateTileBagCounts();
        console.log('Game data reset completed');
    }
}

// เพิ่ม API constants
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

class WordValidator {
    constructor() {
        this.cache = new Map(); // Cache ผลการตรวจสอบคำ
        this.validationTimeouts = new Map(); // เก็บ timeouts สำหรับ debounce
    }

    async validateWord(word) {
        if (!word) return false;
        
        // ตรวจสอบจาก cache ก่อน
        if (this.cache.has(word)) {
            return this.cache.get(word);
        }

        try {
            const response = await fetch(`${DICTIONARY_API_URL}${word}`);
            const isValid = response.ok;
            this.cache.set(word, isValid);
            return isValid;
        } catch (error) {
            console.error('Word validation error:', error);
            return false;
        }
    }

    // ตรวจสอบแบบ real-time พร้อม debounce
    debounceValidate(word, cells, delay = 500) {
        if (this.validationTimeouts.has(word)) {
            clearTimeout(this.validationTimeouts.get(word));
        }

        // เพิ่ม validating state ให้ทุก tile
        cells.forEach(cell => {
            const tile = cell.querySelector('.tile');
            if (tile) {
                tile.classList.remove('valid-word', 'invalid-word');
                tile.classList.add('validating');
            }
        });

        const timeoutId = setTimeout(async () => {
            const isValid = await this.validateWord(word);
            
            // อัพเดทสถานะทุก tile พร้อมกัน
            cells.forEach(cell => {
                const tile = cell.querySelector('.tile');
                if (tile) {
                    tile.classList.remove('validating');
                    tile.classList.add(isValid ? 'valid-word' : 'invalid-word');
                }
            });
            
            this.validationTimeouts.delete(word);
        }, delay);

        this.validationTimeouts.set(word, timeoutId);
    }
}

// 4. Core Classes
class LetterManager {
    constructor() {
        // ใช้ LETTER_DATA โดยตรงแทนการ copy
        this.letterData = LETTER_DATA;
        this.validateData();
        console.log('Letter manager initialized with shared data');
    }

    validateData() {
        const total = Object.values(this.letterData)
            .reduce((sum, {count}) => sum + count, 0);
        if (total !== 100) {
            console.warn('Invalid letter count, resetting...');
            resetLetterData(); // Corrected function name
        }
    }

    getRandomLetter() {
        try {
            const totalRemaining = this.getTotalRemaining();
            if (totalRemaining === 0) {
                console.warn('No letters remaining in bag');
                return null;
            }

            const availableLetters = [];
            Object.entries(this.letterData).forEach(([letter, data]) => {
                if (data.count > 0) {
                    // Weight letters by their remaining count
                    for (let i = 0; i < data.count; i++) {
                        availableLetters.push(letter);
                    }
                }
            });

            if (availableLetters.length === 0) {
                console.warn('No letters available');
                return null;
            }

            const randomIndex = Math.floor(Math.random() * availableLetters.length);
            const letter = availableLetters[randomIndex];
            
            if (!this.letterData[letter]) {
                console.error(`Invalid letter selected: ${letter}`);
                return null;
            }

            this.letterData[letter].count--;
            return letter;
        } catch (error) {
            console.error('Error getting random letter:', error);
            return null;
        }
    }

    returnLetter(letter) {
        if (this.letterData[letter]) {
            this.letterData[letter].count++;
            return true;
        }
        return false;
    }

    getTotalRemaining() {
        return Object.values(this.letterData).reduce((sum, data) => sum + data.count, 0);
    }
}

class ScrabbleBoard {
    constructor(letterRack) {
        this.boardSize = GRID_SIZE;
        this.letterRack = letterRack;
        this.createBoard();
        this.setupDragAndDrop();
        this.wordValidator = new WordValidator();
        this.placedTiles = new Map(); // เพิ่มการเก็บตำแหน่งตัวอักษรที่วางแล้ว
    }

    createBoard() {
        const grid = document.querySelector('.scrabble-grid');
        if (!grid) {
            console.error('Grid element not found');
            return;
        }

        console.log('Creating board...');
        grid.innerHTML = '';
        grid.style.display = 'grid'; // เพิ่มบรรทัดนี้
        grid.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;

        // สร้างเซลล์
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.cellId = `cell-${i}-${j}`;
                
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

    // สร้าง tile ใหม่
    createTile(letter) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = 'tile-' + Date.now();
        tile.draggable = true;
        tile.textContent = letter;

        return tile;
    }

    // จัดการดาวในช่องเริ่มต้น
    handleStar(cell, isRemoving = true) {
        if (cell.classList.contains('start')) {
            const existingStar = cell.querySelector('.fa-star');
            if (isRemoving && existingStar) {
                existingStar.remove();
            } else if (!isRemoving && !existingStar) {
                const star = document.createElement('i');
                star.className = 'fa-solid fa-star';
                cell.appendChild(star);
            }
        }
    }

    // จัดการการวาง tile
    handleTilePlacement(cell, letter, sourceTile = null) {
        // Remove source tile first if it exists
        if (sourceTile) {
            const sourceCell = sourceTile.closest('.cell');
            if (sourceCell) {
                this.letterRack.placedLetters.delete(sourceCell.dataset.cellId);
                sourceTile.remove();
                this.handleStar(sourceCell, false);
            }
        }

        // ลบดาวถ้าเป็นช่องเริ่มต้น
        this.handleStar(cell, true);

        // สร้างและวาง tile ใหม่
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.draggable = true;
        tile.id = 'tile-' + Date.now();
        
        // เพิ่มตัวอักษร
        const letterContent = document.createElement('span');
        letterContent.className = 'letter-content';
        letterContent.textContent = letter;
        tile.appendChild(letterContent);
        
        // Add drag events before appending
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', letter);
            e.dataTransfer.setData('sourceId', tile.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        
        cell.appendChild(tile);
        this.letterRack.placedLetters.set(cell.dataset.cellId, letter);
        this.letterRack.updateButtonState();

        // ตรวจสอบคำหลังจากวางตัวอักษร
        const words = this.findWordsFromCell(cell, letter);
        if (words.length > 0) {
            console.log('Found words:', words);
            words.forEach(({word, cells}) => {
                // ตรวจสอบคำและอัพเดททุก tile ในคำนั้น
                this.wordValidator.debounceValidate(word, cells);
            });
        }
    }

    validateWordAtCell(cell, tile, letter) {
        // ตรวจหาคำที่เกิดจากการวางตัวอักษร
        const words = this.findWordsFromCell(cell, letter);
        words.forEach(word => {
            if (word.length > 1) {
                this.wordValidator.debounceValidate(word, tile);
            }
        });
    }

    getCompleteWord(startRow, startCol, deltaRow, deltaCol) {
        let word = '';
        let row = startRow;
        let col = startCol;
        let length = 0;
        
        // ตรวจสอบข้างเคียงในทิศทางตรงข้าม
        const checkAdjacent = (r, c) => {
            if (deltaRow === 0) { // แนวนอน - ตรวจบนล่าง
                return (r > 0 && this.hasLetterAt(r - 1, c)) ||
                       (r < GRID_SIZE - 1 && this.hasLetterAt(r + 1, c));
            } else { // แนวตั้ง - ตรวจซ้ายขวา
                return (c > 0 && this.hasLetterAt(r, c - 1)) ||
                       (c < GRID_SIZE - 1 && this.hasLetterAt(r, c + 1));
            }
        };

        // อ่านคำ
        while (this.isValidPosition(row, col)) {
            const letter = this.getLetterAt(row, col);
            if (!letter) break;
            
            word += letter;
            length++;

            row += deltaRow;
            col += deltaCol;
        }

        // ถ้าเป็นตัวเดียว ตรวจสอบว่ามีตัวอักษรติดกันหรือไม่
        if (length === 1) {
            return checkAdjacent(startRow, startCol) ? word : null;
        }

        // ถ้ามีมากกว่า 1 ตัว ให้คืนค่าคำนั้นเลย
        return length >= 2 ? word : null;
    }

    findWordsFromCell(cell, letter) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // เก็บตำแหน่งตัวอักษรปัจจุบัน
        this.placedTiles.set(`${row}-${col}`, letter);
        
        // หาคำทั้งแนวนอนและแนวตั้ง
        const words = [];

        // ค้นหาจุดเริ่มต้นของคำแนวนอน
        let startCol = col;
        while (startCol > 0 && this.hasLetterAt(row, startCol - 1)) {
            startCol--;
        }
        const horizontalWord = this.getCompleteWord(row, startCol, 0, 1);

        // ค้นหาจุดเริ่มต้นของคำแนวตั้ง
        let startRow = row;
        while (startRow > 0 && this.hasLetterAt(startRow - 1, col)) {
            startRow--;
        }
        const verticalWord = this.getCompleteWord(startRow, col, 1, 0);

        // เพิ่มคำที่พบพร้อมกับ cells ที่เกี่ยวข้อง
        if (horizontalWord) {
            words.push({
                word: horizontalWord,
                cells: this.getWordCells(row, startCol, 0, 1, horizontalWord.length)
            });
        }
        if (verticalWord) {
            words.push({
                word: verticalWord,
                cells: this.getWordCells(startRow, col, 1, 0, verticalWord.length)
            });
        }

        console.log('Found words:', words); // Debug log
        return words;
    }

    getWordCells(startRow, startCol, deltaRow, deltaCol, length) {
        const cells = [];
        let row = startRow;
        let col = startCol;
        
        for (let i = 0; i < length; i++) {
            const cell = document.querySelector(
                `.cell[data-row="${row}"][data-col="${col}"]`
            );
            if (cell) cells.push(cell);
            row += deltaRow;
            col += deltaCol;
        }
        
        return cells;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
    }

    hasLetterAt(row, col) {
        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
            return false;
        }
        
        // ตรวจสอบจาก placedTiles หรือ board
        const key = `${row}-${col}`;
        if (this.placedTiles.has(key)) {
            return true;
        }

        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        return cell?.querySelector('.tile') !== null;
    }

    getLetterAt(row, col) {
        // ตรวจสอบจาก placedTiles ก่อน
        const key = `${row}-${col}`;
        if (this.placedTiles.has(key)) {
            return this.placedTiles.get(key);
        }

        // ถ้าไม่มีใน placedTiles ให้ดูจาก board
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        return cell?.querySelector('.letter-content')?.textContent || '';
    }

    setupDragAndDrop() {
        const cells = document.querySelectorAll('.scrabble-grid .cell');
        
        cells.forEach(cell => {
            // จัดการ dragover
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move'; // Ensure move effect
                if (!cell.querySelector('.tile')) {
                    cell.classList.add('drag-over');
                }
            });

            // จัดการ dragleave
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });

            // จัดการ drop
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');

                if (!cell.querySelector('.tile')) {
                    const letter = e.dataTransfer.getData('text/plain');
                    const sourceId = e.dataTransfer.getData('sourceId');
                    const sourceTile = document.getElementById(sourceId);
                    
                    if (sourceTile) {
                        this.handleTilePlacement(cell, letter, sourceTile);
                    }
                }
            });
        });
    }
    
    placeLetter(row, col, letter) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell && !cell.querySelector('.tile')) {
            this.handleTilePlacement(cell, letter);
            return true;
        }
        return false;
    }
}

class LetterRack {
    constructor(letterManager) {
        this.rack = document.getElementById('letter-rack');
        this.letters = [];
        this.placedLetters = new Map();
        this.maxLetters = RACK_SIZE;
        this.letterManager = letterManager;
        this.fillInitialRack(); 
        this.updateRackDisplay();
        this.hasShuffled = false;
        this.setupButtons();
    }

    setupButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const shuffleBtn = document.getElementById('shuffleBtn');
        
        // Disable undo initially
        undoBtn.disabled = true;
        undoBtn.style.opacity = '0.5';
        
        const shuffleHandler = () => {
            if (this.letters.length > 0) {
                this.shuffleLetters();
            }
        };
    
        shuffleBtn?.addEventListener('click', shuffleHandler);
        
        undoBtn?.addEventListener('click', () => {
            if (this.placedLetters.size > 0) {
                this.returnLettersToRack();
                this.clearBoardLetters();
            }
        });
    }

    clearBoardLetters() {
        const cells = document.querySelectorAll('.scrabble-grid .cell');
        cells.forEach(cell => {
            const tile = cell.querySelector('.tile');
            if (tile) {
                tile.remove(); // ลบ tile ออกจาก cell
            }
            // เพิ่มดาวกลับมาที่ช่องกลาง
            if (cell.classList.contains('start')) {
                const existingStar = cell.querySelector('.fa-star');
                if (!existingStar) {
                    const star = document.createElement('i');
                    star.className = 'fa-solid fa-star';
                    cell.appendChild(star);
                }
            }
        });
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
    
        return tile;
    }

    fillInitialRack() {
        // เคลียร์ letters array ก่อนเติมตัวอักษรใหม่เท่านั้น ไม่ต้องรีเซ็ต LETTER_DATA
        this.letters = [];
        while (this.letters.length < this.maxLetters) {
            const letter = this.letterManager.getRandomLetter();
            if (!letter) break;
            this.letters.push(letter);
        }
        // อัพเดทการแสดงผลหลังจากเติมตัวอักษร
        this.updateRackDisplay();
    }
    
    fillRack() {
        let attempts = 0;
        const maxAttempts = 10;
        while (this.letters.length < this.maxLetters && attempts < maxAttempts) {
            const letter = this.letterManager.getRandomLetter();
            if (!letter) {
                console.log('Letter bag is empty, cannot fill rack further');
                break;
            }
            this.letters.push(letter);
            attempts++;
        }
        this.updateRackDisplay();
        updateTileBagCounts();
    }
    

    refreshLetters() {
        // Return letters to the bag
        this.letters.forEach(letter => {
            this.letterManager.returnLetter(letter);
        });
        
        // Clear and refill rack
        this.letters = [];
        this.fillRack();
        updateTileBagCounts();
    }

    returnLettersToRack() {
        const boardTiles = document.querySelectorAll('.scrabble-grid .cell .tile');
        const returningLetters = [];
        
        // Collect all letters from board first
        boardTiles.forEach(tile => {
            const letter = tile.querySelector('.letter-content')?.textContent;
            if (letter) {
                returningLetters.push(letter);
                this.letterManager.returnLetter(letter);
                tile.remove();
            }
        });

        // Add letters back to rack while respecting RACK_SIZE limit
        const availableSlots = this.maxLetters - this.letters.length;
        const lettersToAdd = returningLetters.slice(0, availableSlots);
        
        lettersToAdd.forEach(letter => {
            if (this.letters.length < this.maxLetters) {
                this.letters.push(letter);
            }
        });

        // Update rack display and button states
        this.updateRackDisplay();
        this.placedLetters.clear();
        this.updateButtonState();
        
        // Log any letters that couldn't be returned
        const remainingLetters = returningLetters.slice(availableSlots);
        if (remainingLetters.length > 0) {
            console.warn('Some letters could not be returned to rack:', remainingLetters);
        }
    }

    updateRackDisplay() {
        // Clear current rack display
        while (this.rack.firstChild) {
            this.rack.removeChild(this.rack.firstChild);
        }
        
        // Add tiles for each letter
        this.letters.forEach(letter => {
            const tile = this.createLetterTile(letter);
            this.setupTileDragEvents(tile, letter);
            this.rack.appendChild(tile);
        });
    }

    setupTileDragEvents(tile, letter) {
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', letter);
            e.dataTransfer.setData('sourceId', tile.id);
            e.dataTransfer.effectAllowed = 'move'; // Ensure move effect
            tile.classList.add('dragging');
        });

        tile.addEventListener('dragend', (e) => {
            tile.classList.remove('dragging');
            if (e.dataTransfer.dropEffect === 'move') {
                // ลบตัวอักษรออกจาก rack เมื่อวางสำเร็จ
                const index = this.letters.indexOf(letter);
                if (index > -1) {
                    this.letters.splice(index, 1);
                    tile.remove();
                }
                this.updateButtonState();
            }
        });
    }

    shuffleLetters() {
        // สลับเฉพาะตัวอักษรที่มีอยู่ใน this.letters เท่านั้น
        for (let i = this.letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.letters[i], this.letters[j]] = [this.letters[j], this.letters[i]];
        }
        // อัพเดทการแสดงผลหลังจากสลับตัวอักษร
        this.updateRackDisplay();
        console.log('Shuffled letters:', this.letters);
    }
    

    updateButtonState() {
        const shuffleBtn = document.getElementById('shuffleBtn');
        const undoBtn = document.getElementById('undoBtn');
        
        if (this.placedLetters.size > 0) {
            // If letters are placed, enable undo and disable shuffle
            shuffleBtn.disabled = true;
            shuffleBtn.style.opacity = '0.5';
            undoBtn.disabled = false;
            undoBtn.style.opacity = '1';
        } else {
            // If no letters are placed, enable shuffle and disable undo
            shuffleBtn.disabled = false;
            shuffleBtn.style.opacity = '1';
            undoBtn.disabled = true;
            undoBtn.style.opacity = '0.5';
        }
    }
}

class GameControls {
    constructor(letterRack) {
        this.letterRack = letterRack;
        this.setupActionButtons();
        this.setupMenuButtons(); // เพิ่มการจัดการปุ่มเมนู
    }

    setupMenuButtons() {
        const quitBtn = document.getElementById('quitBtn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                showConfirmBox('Are you sure you want to quit?', 
                    () => {
                        resetLetterData();
                        window.location.href = '../index.html';
                    }, 
                    () => console.log('Quit canceled')
                );
            });
        }
    }

    handleResign() {
        showConfirmBox('Are you sure you want to resign?', 
            () => {
                resetLetterData();
                window.location.href = '../index.html';
            }, 
            () => console.log('Resign canceled')
        );
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
        showConfirmBox('Are you sure you want to resign?', 
            () => {
                window.location.href = '../index.html';
            }, 
            () => {
                console.log('Resign canceled');
            }
        );
    }

    handleSkipTurn() {
        showConfirmBox('Are you sure you want to skip your turn?', 
            () => {
                console.log('Skip turn');
            },
            () => {
                console.log('Skip canceled');
            }
        );
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
            score.textContent = LETTER_DATA[letter]?.score || 0;
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
        const placedTiles = document.querySelectorAll('.scrabble-grid .cell .tile');
        if (placedTiles.length === 0) {
            alert('Please place some letters first');
            return;
        }

        // ตรวจสอบว่ามีตัวอักษรที่ต่อกันหรือไม่
        const cells = Array.from(placedTiles).map(tile => tile.closest('.cell'));
        const words = this.findConnectedWords(cells);

        if (words.length === 0) {
            alert('Letters must connect to form valid words');
            return;
        }

        // ตรวจสอบความถูกต้องของคำทั้งหมด
        this.validateWords(words).then(allValid => {
            if (allValid) {
                const score = this.calculateScore(words);
                
                // อัพเดทคะแนนในหน้าจอ
                const playerScore = document.getElementById('playerScore');
                const currentScore = parseInt(playerScore.textContent) || 0;
                playerScore.textContent = currentScore + score;
                
                // เคลียร์ placedLetters
                this.letterRack.placedLetters.clear();
                // เติมตัวอักษรใหม่
                this.letterRack.fillRack();
                // ปิดใช้งานปุ่ม undo
                this.letterRack.updateButtonState();

                // สลับเทิร์น
                window.gameManager.switchTurn();

                // ถ้าเป็นเทิร์นของบอท
                if (!window.gameManager.isPlayerTurn) {
                    setTimeout(() => {
                        window.bot.makeMove().then(() => {
                            window.gameManager.switchTurn();
                        });
                    }, 1000);
                }
            } else {
                alert('Invalid word(s) found. Please check your placement.');
            }
        });
    }

    findConnectedWords(cells) {
        const words = new Set();
        const processedCells = new Set();

        cells.forEach(cell => {
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            // ตรวจสอบแนวนอน
            const horizontalWord = this.getWordInDirection(row, col, 0, 1);
            if (horizontalWord && horizontalWord.word.length > 1) {
                words.add(horizontalWord);
            }

            // ตรวจสอบแนวตั้ง
            const verticalWord = this.getWordInDirection(row, col, 1, 0);
            if (verticalWord && verticalWord.word.length > 1) {
                words.add(verticalWord);
            }
        });

        return Array.from(words);
    }

    getWordInDirection(startRow, startCol, deltaRow, deltaCol) {
        // หาจุดเริ่มต้นของคำ
        let row = startRow;
        let col = startCol;
        while (this.hasLetterAt(row - deltaRow, col - deltaCol)) {
            row -= deltaRow;
            col -= deltaCol;
        }

        // สร้างคำจากตำแหน่งเริ่มต้น
        let word = '';
        const wordCells = [];
        let currentRow = row;
        let currentCol = col;

        while (this.hasLetterAt(currentRow, currentCol)) {
            const letter = this.getLetterAt(currentRow, currentCol);
            if (!letter) break;

            word += letter;
            const cell = document.querySelector(
                `.cell[data-row="${currentRow}"][data-col="${currentCol}"]`
            );
            if (cell) wordCells.push(cell);

            currentRow += deltaRow;
            currentCol += deltaCol;
        }

        return word.length > 1 ? { word, cells: wordCells } : null;
    }

    hasLetterAt(row, col) {
        const cell = document.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`
        );
        return cell?.querySelector('.tile') !== null;
    }

    getLetterAt(row, col) {
        const cell = document.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`
        );
        return cell?.querySelector('.letter-content')?.textContent || '';
    }

    async validateWords(words) {
        try {
            // เปลี่ยนวิธีการดึงคำและตรวจสอบ
            const validations = await Promise.all(
                words.map(async ({word}) => {
                    console.log('Validating word:', word); // Debug log
                    const isValid = await window.gameBoard.wordValidator.validateWord(word);
                    console.log('Word validation result:', word, isValid); // Debug log
                    return isValid;
                })
            );
            return validations.every(result => result === true);
        } catch (error) {
            console.error('Error validating words:', error);
            return false;
        }
    }

    calculateScore(words) {
        let totalScore = 0;
        words.forEach(word => {
            let wordScore = 0;
            let wordMultiplier = 1;

            // คำนวณคะแนนแต่ละตัวอักษร
            for (const letter of word) {
                const letterScore = LETTER_DATA[letter].score;
                // TODO: เพิ่มการคูณคะแนนตามช่องพิเศษ
                wordScore += letterScore;
            }

            // คูณคะแนนรวมของคำ (ถ้ามีช่อง DW หรือ TW)
            totalScore += wordScore * wordMultiplier;
        });

        return totalScore;
    }
}

class ScoreManager {
    constructor() {
        this.playerScore = 0;
        this.botScore = 0;
        this.scoreDisplay = document.getElementById('score-display');
    }

    addPoints(points, isPlayer = true) {
        if (isPlayer) {
            this.playerScore += points;
        } else {
            this.botScore += points;
        }
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.innerHTML = `
                <div>Player: ${this.playerScore}</div>
                <div>Bot: ${this.botScore}</div>
            `;
        }
    }
}

class GameManager {
    constructor() {
        this.isPlayerTurn = Math.random() < 0.5;
        this.turnTime = 15 * 60; // 15 minutes in seconds
        this.playerTimeLeft = this.turnTime;
        this.botTimeLeft = this.turnTime;
        this.timerInterval = null;
        this.initialize();
    }

    initialize() {
        // แสดงผล turn แรก
        this.updateTurnIndicator();
        // เริ่มจับเวลา
        this.startTimer();
    }

    updateTurnIndicator() {
        const playerSection = document.querySelector('.player-section');
        const botSection = document.querySelector('.bot-section');

        if (this.isPlayerTurn) {
            playerSection.classList.add('active');
            botSection.classList.remove('active');
        } else {
            botSection.classList.add('active');
            playerSection.classList.remove('active');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPlayerTurn) {
                this.playerTimeLeft--;
                this.updateTimeDisplay('playerTime', this.playerTimeLeft);
            } else {
                this.botTimeLeft--;
                this.updateTimeDisplay('botTime', this.botTimeLeft);
            }

            if (this.playerTimeLeft <= 0 || this.botTimeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimeDisplay(elementId, timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById(elementId).textContent = timeString;
    }

    switchTurn() {
        this.isPlayerTurn = !this.isPlayerTurn;
        this.updateTurnIndicator();
    }

    endGame() {
        clearInterval(this.timerInterval);
        // TODO: Implement game end logic
    }
}

// 5. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('scrabble_cw.html')) {
        try {
            console.log('Initializing game...');
            
            // รีเซ็ต LETTER_DATA ครั้งเดียวตอนเริ่มเกม
            resetLetterData();
            
            const letterManager = new LetterManager();
            const letterRack = new LetterRack(letterManager);
            const board = new ScrabbleBoard(letterRack);
            const controls = new GameControls(letterRack);
            const scoreManager = new ScoreManager();
            
            // 1. จัดการ player rack ก่อน
            letterRack.fillInitialRack();
            letterRack.setupButtons();
            
            // 2. จัดการ bot rack 
            const bot = new ScrabbleBot(board, letterManager);
            
            // 3. อัพเดทจำนวนตัวอักษรหลังจากทั้งสองฝ่ายได้ตัวอักษรครบ
            updateTileBagCounts();

            // Initialize game manager
            window.gameManager = new GameManager();
            window.bot = bot; // Store bot reference globally

            // ...existing code...

            // Handle page reload/close
            window.addEventListener('beforeunload', (e) => {
                // Cancel the event if needed
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
                
                resetLetterData();
            });
            
            window.addEventListener('unload', cleanupGame);

        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }
});