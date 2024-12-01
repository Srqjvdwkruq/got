// DOM Elements
const elements = {
    container: document.getElementById('container'),
    menuBtn: document.getElementById('menuBtn'),
    quitBtn: document.getElementById('quitBtn'),
    continueBtn: document.getElementById('continueBtn'),
    title: document.querySelector('.title'),
    description: document.querySelector('.description')
};

// แอนิเมชั่นตัวอักษรหน้าหลัก
function addAnimation(element, animationClass) {
    if (!element) return;
    element.classList.remove('fade-in', 'slide-in', 'pop-in');
    void element.offsetWidth; // Trigger reflow
    element.classList.add(animationClass);
}

// Screen Transition Functions
function showScreen(screenToShow, screenToHide) {
    // Hide current screen
    screenToHide.style.opacity = '0';
    
    setTimeout(() => {
        screenToHide.style.display = 'none';
        // Show new screen
        screenToShow.style.display = 'flex';
        // Force reflow
        void screenToShow.offsetWidth;
        screenToShow.style.opacity = '1';
    }, 300);
}

// Confirmation Box Functions
function showConfirmBox(message, onConfirm, onCancel) {
    const confirmBox = document.getElementById('confirmBox');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    // Set message
    confirmMessage.textContent = message;

    // Show confirm box
    confirmBox.classList.add('show');

    // Setup button handlers
    const handleYes = () => {
        confirmBox.classList.remove('show');
        confirmYes.removeEventListener('click', handleYes);
        confirmNo.removeEventListener('click', handleNo);
        if (onConfirm) onConfirm();
    };

    const handleNo = () => {
        confirmBox.classList.remove('show');
        confirmYes.removeEventListener('click', handleYes);
        confirmNo.removeEventListener('click', handleNo);
        if (onCancel) onCancel();
    };

    confirmYes.addEventListener('click', handleYes);
    confirmNo.addEventListener('click', handleNo);

    // Close on ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            handleNo();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Menu Button Functions
function setupMenuButton() {
    // Get menu elements
    const menuBtn = document.getElementById('menuBtn');
    const menuButton = menuBtn?.querySelector('.menu-btn');
    const menuDropdown = menuBtn?.querySelector('.menu-dropdown');

    // Toggle dropdown when Menu button is clicked
    menuButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuBtn?.contains(e.target) && menuDropdown?.classList.contains('show')) {
            menuDropdown.classList.remove('show');
        }
    });

    // Continue button - closes dropdown
    elements.continueBtn?.addEventListener('click', () => {
        menuDropdown?.classList.remove('show');
    });

    // Quit button - shows confirmation before quitting
    elements.quitBtn?.addEventListener('click', () => {
        menuDropdown?.classList.remove('show');
        showConfirmBox(
            'Are you sure you want to quit the game?',
            () => window.location.href = '../index.html'
        );
    });

    // Close dropdown on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuDropdown?.classList.contains('show')) {
            menuDropdown.classList.remove('show');
        }
    });
}

// Event Listeners for Home Screen and Game Modes
document.addEventListener('DOMContentLoaded', () => {
    // Setup menu button if we're in a game mode
    if (window.location.pathname.includes('_cw.html')) {
        setupMenuButton();
    }
    
    // Handle home screen elements
    if (elements.container) {
        // Initial animations for home screen
        addAnimation(elements.title, 'fade-in');
        setTimeout(() => addAnimation(elements.description, 'slide-in'), 200);
    }
});

// Background Animation
class BackgroundAnimation {
    constructor() {
        this.container = document.querySelector('.background-animation');
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.maxLetters = 20; // ลดจำนวนตัวอักษรสูงสุด
        this.createInterval = null;
        this.init();
    }

    init() {
        if (!this.container) return;
        
        // สร้างตัวอักษรใหม่ช้าลง (ทุก 1.2 วินาที)
        this.createInterval = setInterval(() => this.createLetter(), 1200);
        
        // เริ่มต้นด้วยตัวอักษรน้อยลง
        for (let i = 0; i < this.maxLetters / 3; i++) {
            this.createLetter();
        }
    }

    createLetter() {
        if (!this.container) return;
        
        // ตรวจสอบจำนวนตัวอักษรปัจจุบัน
        const currentLetters = this.container.children.length;
        if (currentLetters >= this.maxLetters) {
            return;
        }
        
        const letter = document.createElement('div');
        letter.className = 'falling-letter';
        
        // Random letter
        letter.textContent = this.letters[Math.floor(Math.random() * this.letters.length)];
        
        // Random size class
        const sizes = ['small', 'medium', 'large'];
        letter.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);
        
        // Random position and initial rotation
        const left = Math.random() * 100;
        const initialRotation = Math.random() * 360;
        const fallDelay = Math.random() * 5;
        
        letter.style.cssText = `
            left: ${left}%;
            transform: rotate(${initialRotation}deg);
            animation-delay: -${fallDelay}s;
        `;
        
        this.container.appendChild(letter);
        
        // Remove letter after animation
        letter.addEventListener('animationend', () => {
            if (letter && letter.parentNode === this.container) {
                this.container.removeChild(letter);
            }
        });
    }

    stop() {
        if (this.createInterval) {
            clearInterval(this.createInterval);
            this.createInterval = null;
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundAnimation();
});
