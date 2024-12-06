// ใช้ import จาก scrabbleMode.js โดยตรง
import { LETTER_DATA, updateTileBagCounts, resetLetterData } from './scrabbleMode.js';

// Bot configuration and utilities
class BotRack {
    constructor(letterManager) {
        if (!letterManager) {
            throw new Error('LetterManager is required');
        }
        
        this.letterManager = letterManager;
        this.letters = [];
        this.maxLetters = 7;
        console.log('Bot initial rack:', this.letters);
        
        // เรียก fillInitialRack แทน fillRack เพื่อจำกัดจำนวนการดึงตัวอักษร
        this.fillInitialRack();
        
    }

    fillInitialRack() {
        if (!this.letterManager) {
            console.error('No letter manager available');
            return;
        }

        // ดึงตัวอักษรจนครบ 7 ตัวเท่านั้น
        while (this.letters.length < this.maxLetters) {
            const letter = this.letterManager.getRandomLetter();
            if (!letter) {
                console.log('No more letters available for bot');
                break;
            }
            this.letters.push(letter);
        }
        
        console.log('Bot initial rack:', this.letters);
        this.updateDisplay();
    }

    getRandomLetter() {
        return this.letterManager.getRandomLetter();
    }

    fillRack() {
        if (!this.letterManager) {
            console.error('No letter manager available');
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;
        while (this.letters.length < this.maxLetters && attempts < maxAttempts) {
            const letter = this.letterManager.getRandomLetter();
            if (!letter) {
                console.log('Letter bag is empty, cannot fill bot rack further');
                break;
            }
            this.letters.push(letter);
            attempts++;
        }

        this.updateDisplay();
        updateTileBagCounts();
    }

    updateDisplay() {
        const botRackElement = document.getElementById('bot-rack');
        if (!botRackElement) {
            console.warn('Bot rack display element not found');
            return;
        }

        const rackHTML = this.letters.map(letter => {
            const score = LETTER_DATA[letter]?.score || 0;
            return `
                <div class="letter-tile">
                    <span class="letter-content">${letter}</span>
                    <span class="letter-score">${score}</span>
                </div>
            `;
        }).join('');

        botRackElement.innerHTML = rackHTML;
    }

    clearRack() {
        if (this.letters.length > 0) {
            // Return letters to bag before clearing
            this.letters.forEach(letter => {
                this.letterManager.returnLetter(letter);
            });
            console.log('Clearing bot rack:', this.letters.join(', '));
            this.letters = [];
            this.updateDisplay();
            updateTileBagCounts();
        }
    }

    removeLetter(letter) {
        const index = this.letters.indexOf(letter);
        if (index > -1) {
            this.letters.splice(index, 1);
            console.log(`Bot removed letter: ${letter}, Remaining letters:`, this.letters.join(', '));
        }
    }

    addLetter(letter) {
        if (this.letters.length < this.maxLetters) {
            this.letters.push(letter);
            console.log(`Bot added new letter: ${letter}, Current rack:`, this.letters.join(', '));
            return true;
        }
        console.log('Cannot add letter - rack is full');
        return false;
    }
}

class ScrabbleBot {
    constructor(board, letterManager) {
        if (!board || !letterManager) {
            throw new Error('Missing required dependencies');
        }
        
        this.board = board;
        this.letterManager = letterManager;
        this.rack = new BotRack(this.letterManager);
        this.dictionary = new Set();
        this.score = 0;
        
        console.log('ScrabbleBot initialized');
    }

    cleanup() {
        if (this.rack) {
            this.rack.clearRack();
        }
        this.score = 0;
    }

    // ฟังก์ชันสำหรับหาคำที่เป็นไปได้จาก rack
    findPossibleWords() {
        const words = [];
        const rackLetters = this.rack.letters.join('');
        
        // Create all possible letter combinations
        const combinations = [];
        for (let len = 2; len <= rackLetters.length; len++) {
            this.getCombinations(rackLetters, len, '', combinations);
        }
        
        // Filter valid words
        words.push(...combinations.filter(word => this.dictionary.has(word)));
        return words;
    }

    getCombinations(letters, len, current, results) {
        if (current.length === len) {
            results.push(current);
            return;
        }
        
        for (let i = 0; i < letters.length; i++) {
            this.getCombinations(
                letters.slice(0, i) + letters.slice(i + 1),
                len,
                current + letters[i],
                results
            );
        }
    }

    // ฟังก์ชันสำหรับหาตำแหน่งที่ดีที่สุดในการวางคำ
    findBestPlacement(word) {
        // TODO: Implement placement strategy
        return null;
    }

    // ฟังก์ชันสำหรับเล่นเทิร์นของบอท
    async playTurn() {
        console.log('Bot is playing turn...');
        const possibleWords = this.findPossibleWords();
        if (possibleWords.length === 0) {
            console.log('Bot cannot find any valid words');
            return false;
        }

        // เลือกคำที่ดีที่สุดและหาตำแหน่งที่เหมาะสม
        for (const word of possibleWords) {
            const placement = this.findBestPlacement(word);
            if (placement) {
                // วางคำบนบอร์ด
                // TODO: Implement word placement
                return true;
            }
        }

        console.log('Bot could not place any words');
        return false;
    }

    async makeMove() {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second

        const move = this.findBestMove();
        if (move) {
            this.executeMove(move);
            updateTileBagCounts(); // Update counts after move
            return true;
        }

        console.log('Bot could not find any valid moves');
        return false;
    }

    findBestMove() {
        // TODO: Implement actual word finding logic
        // For now just return first letter placement possible
        if (this.rack.letters.length > 0) {
            return {
                letter: this.rack.letters[0],
                row: 7,
                col: 8
            };
        }
        return null;
    }

    validateMove(move) {
        if (!move || !move.letter || move.row === undefined || move.col === undefined) {
            console.error('Invalid move format');
            return false;
        }

        // Check if cell is empty
        const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
        if (!cell || cell.querySelector('.tile')) {
            console.log('Cell is not available for placement');
            return false;
        }

        // Validate letter is in bot's rack
        if (!this.rack.letters.includes(move.letter)) {
            console.error('Letter not in bot rack:', move.letter);
            return false;
        }

        return true;
    }

    executeMove(move) {
        if (!this.validateMove(move)) {
            console.error('Invalid move, skipping execution');
            return false;
        }

        const success = this.board.placeLetter(move.row, move.col, move.letter);
        if (success) {
            this.rack.removeLetter(move.letter);
            this.score += this.calculateScore(move);
            this.rack.fillRack();
            return true;
        }
        return false;
    }

    calculateScore(move) {
        // TODO: Implement proper scoring
        return LETTER_DATA[move.letter]?.score || 0;
    }
}

// Export classes for use in main game file
export { BotRack, ScrabbleBot };
