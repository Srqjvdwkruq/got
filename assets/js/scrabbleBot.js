// Import required functions and data
import { LETTER_DATA, updateTileBagCounts } from './scrabbleMode.js';

// Bot configuration and utilities
class BotRack {
    constructor() {
        this.letters = [];
        this.maxLetters = 7; // RACK_SIZE
        this.fillRack();
        console.log('Bot initial rack:', this.letters);
    }

    getRandomLetter() {
        // ตรวจสอบจำนวนตัวอักษรที่เหลือทั้งหมด
        const totalAvailable = Object.values(LETTER_DATA).reduce((sum, data) => sum + data.count, 0);
        if (totalAvailable === 0) {
            console.log('Bot: No letters available in tile bag');
            return null;
        }

        const availableLetters = Object.entries(LETTER_DATA)
            .filter(([letter, data]) => data.count > 0)
            .map(([letter]) => letter);
        
        console.log('Bot: Available letters to choose from:', availableLetters.join(', '));
        
        if (availableLetters.length === 0) {
            console.log('Bot: No letters available to pick');
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        const letter = availableLetters[randomIndex];
        LETTER_DATA[letter].count--;
        updateTileBagCounts(); // อัพเดต tile bag display
        console.log('Bot: Picked letter:', letter, '(Score:', LETTER_DATA[letter].score, ')');
        return letter;
    }

    fillRack() {
        console.log('Bot: Starting to fill rack...');
        console.log('Bot: Current rack:', this.letters.join(', '));
        
        // ตรวจสอบว่าต้องการตัวอักษรเพิ่มกี่ตัว
        const neededLetters = this.maxLetters - this.letters.length;
        console.log('Bot: Need', neededLetters, 'more letters');
        
        // ตรวจสอบจำนวนตัวอักษรที่เหลือทั้งหมด
        const totalAvailable = Object.values(LETTER_DATA).reduce((sum, data) => sum + data.count, 0);
        console.log('Bot: Total letters available in tile bag:', totalAvailable);
        
        // ถ้าตัวอักษรไม่พอ ให้ใช้เท่าที่มี
        const lettersToAdd = Math.min(neededLetters, totalAvailable);
        console.log('Bot: Will add', lettersToAdd, 'letters');
        
        for (let i = 0; i < lettersToAdd; i++) {
            const letter = this.getRandomLetter();
            if (!letter) {
                console.log('Bot: Could not get more letters');
                break;
            }
            this.letters.push(letter);
            console.log('Bot: Added letter to rack. Current rack:', this.letters.join(', '));
        }
        
        console.log('Bot: Finished filling rack. Final rack:', this.letters.join(', '));
        updateTileBagCounts();
    }

    clearRack() {
        console.log('Clearing bot rack');
        this.letters = [];
        updateTileBagCounts();
    }
}

class ScrabbleBot {
    constructor(board) {
        this.board = board;
        this.rack = new BotRack();
        this.dictionary = new Set(); // สำหรับเก็บคำศัพท์ที่ถูกต้อง
        this.loadDictionary();
    }

    async loadDictionary() {
        try {
            const response = await fetch('assets/data/dictionary.txt');
            const text = await response.text();
            this.dictionary = new Set(text.split('\n').map(word => word.trim()));
            console.log('Dictionary loaded successfully');
        } catch (error) {
            console.error('Error loading dictionary:', error);
        }
    }

    // ฟังก์ชันสำหรับหาคำที่เป็นไปได้จาก rack
    findPossibleWords() {
        const words = [];
        // TODO: Implement word finding algorithm
        return words;
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
}

// Export classes for use in main game file
export { BotRack, ScrabbleBot };
