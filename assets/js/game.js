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
    void element.offsetWidth;
    element.classList.add(animationClass);
}

// ฟังก์ชันการเปลี่ยนหน้าจอ
function showScreen(screenToShow, screenToHide) {
    // Hide current screen
    screenToHide.style.opacity = '0'; // ซ่อนหน้าจอปัจจุบัน
    
    setTimeout(() => { // ตั้งเวลา
        screenToHide.style.display = 'none';
        // แสดงหน้าจอใหม่
        screenToShow.style.display = 'flex';
        // บังคับ reflow
        void screenToShow.offsetWidth;
        // แสดงหน้าจอใหม่
        screenToShow.style.opacity = '1';
    }, 300);
}

// Background Animation
class BackgroundAnimation {
    constructor() {
        this.container = document.querySelector('.background-animation');
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.maxLetters = 20; // จำนวนตัวอักษรสูงสุด
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
        
        // สุ่มตัวอักษร
        letter.textContent = this.letters[Math.floor(Math.random() * this.letters.length)];
        
        // สุ่มขนาดตัวอักษร
        const sizes = ['small', 'medium', 'large'];
        letter.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);
        
        // สุ่มตำแหน่งและการหมุนของตัวอักษร
        const left = Math.random() * 100;
        const initialRotation = Math.random() * 360;
        const fallDelay = Math.random() * 5;
        
        letter.style.cssText = `
            left: ${left}%;
            transform: rotate(${initialRotation}deg);
            animation-delay: -${fallDelay}s;
        `;
        
        this.container.appendChild(letter);
        
        // ลบตัวอักษรเมื่อแอนิเมชันสิ้นสุดลง
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

// ฟังก์ชัน Confirm Box
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

// ฟังก์ชัน Menu Button
function setupMenuButton() {
    // Get menu elements
    const menuBtn = document.getElementById('menuBtn');
    const menuButton = menuBtn?.querySelector('.menu-btn');
    const menuDropdown = menuBtn?.querySelector('.menu-dropdown');
    const continueBtn = document.getElementById('continueBtn');
    const quitBtn = document.getElementById('quitBtn');

    if (!menuBtn || !menuButton || !menuDropdown) {
        console.error('Menu elements not found:', { menuBtn, menuButton, menuDropdown });
        return;
    }

    // Toggle dropdown when Menu button is clicked
    menuBtn.addEventListener('click', (e) => {  
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
    });

    // Handle continue button
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            menuDropdown.classList.remove('show');
            // Add your continue game logic here
        });
    }

    // Handle quit button
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            showConfirmBox('Are you sure you want to quit?', 
                () => {
                    window.location.href = '../index.html';
                },
                () => {
                    menuDropdown.classList.remove('show');
                }
            );
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (menuDropdown.classList.contains('show') && !menuBtn.contains(e.target)) {
            menuDropdown.classList.remove('show');
        }
    });

    // Close dropdown when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuDropdown.classList.contains('show')) {
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

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundAnimation();
});
