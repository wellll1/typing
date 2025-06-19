const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const wpmSpan = document.getElementById('wpm');
const timerSpan = document.getElementById('timer');
const restartButton = document.getElementById('restart-button');
const statsDiv = document.querySelector('.stats'); 
const wordCountInput = document.getElementById('wordCount');

let currentText = '';
let startTime = 0;
let timerInterval;
let typedCharacters = 0;
let correctCharacters = 0;
let errors = 0;
let isTypingStarted = false;

async function fetchRandomWikipediaText() {
    textDisplay.textContent = 'جالس يحمل النص اصبر'; 
    textInput.disabled = true; 
    restartButton.disabled = true; 
    wordCountInput.disabled = true; 

    statsDiv.classList.remove('show'); 
    wpmSpan.textContent = 0; 
    timerSpan.textContent = 0;

    let collectedRawText = '';
    const desiredWordCount = parseInt(wordCountInput.value, 10);
    const maxFetchAttempts = 15; 
    
    try {
        for (let i = 0; i < maxFetchAttempts; i++) {
            const response = await fetch('https://ar.wikipedia.org/w/api.php?action=query&format=json&generator=random&grnnamespace=0&prop=extracts&exchars=1500&explaintext=1&origin=*');
            const data = await response.json();

            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            let rawText = pages[pageId].extract;

            rawText = rawText.replace(/\[.*?\]|\(.*?\)/g, '');
            rawText = rawText.replace(/[0-9]/g, '');
            rawText = rawText.replace(/[a-zA-Z]/g, '');
            rawText = rawText.replace(/[\u064B-\u0652]/g, ""); 
            rawText = rawText.replace(/[أإآ]/g, "ا");
            rawText = rawText.replace(/ى/g, "ي");
            rawText = rawText.replace(/[^\u0600-\u06FF\s]/g, ''); 
            rawText = rawText.replace(/[،؛ـ؟‘’“”٬]/g, ''); 
            
            rawText = rawText.replace(/(\S*?(\S)\2{2,}\S*?)/g, ' '); 
            rawText = rawText.replace(/(كوم|دوت|www|http|wiki|صفحة|موقع|ويكيبيديا|مراجع|المراجع|وصلات|خارجية|ببليوغرافيا|ملاحظات|مصادر|دراسات|قراءات\s*إضافية|كتب|مجلات|مواقع|أنظر\s*أيضا)\S*/g, ' ');
            
            rawText = rawText.replace(/\b\S{9,}\b/g, ' '); 
            
            rawText = rawText.replace(/\b(مونتيروني|ديسكوغز|بيزبول|رفرنس|كوم|ويكيبيديا|اوليمبيديا|انظر|أيضا|وصلات|خارجية|ببليوغرافيا|ملاحظات|مصادر|دراسات|قراءات|إضافية|كتب|مجلات|مواقع|مراجع|المراجع)\b/g, ' ');
            
            rawText = rawText.replace(/\s+/g, ' ').trim();

            if (rawText.length > 0) {
                collectedRawText += ' ' + rawText; 
                if (collectedRawText.split(/\s+/).filter(word => word.length > 0).length >= desiredWordCount) {
                    break; 
                }
            }
        }

        const words = collectedRawText.split(/\s+/).filter(word => word.length > 0);
        let selectedText = words.slice(0, desiredWordCount).join(' ');

        if (!selectedText.trim() || words.length < desiredWordCount / 2) {
            selectedText = ""; 
        }
        
        return selectedText;

    } catch (error) {
        console.error('Error fetching Wikipedia text:', error);
        return ""; 
    } finally {
        textInput.disabled = false; 
        restartButton.disabled = false; 
        wordCountInput.disabled = false; 
    }
}

async function initializeTest() {
    currentText = await fetchRandomWikipediaText(); 
    
    textDisplay.innerHTML = ''; 
    textInput.value = ''; 

    if (currentText.length === 0) {
        textDisplay.textContent = 'عذراً، لم يتم العثور على نص عربي مناسب بالعدد المطلوب. حاول مرة أخرى أو قلل عدد الكلمات.';
        textInput.disabled = true; 
    } else {
        currentText.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            textDisplay.appendChild(charSpan);
        });
        textInput.disabled = false; 
    }

    typedCharacters = 0;
    correctCharacters = 0;
    errors = 0;
    isTypingStarted = false;
    wpmSpan.textContent = 0;
    timerSpan.textContent = 0;
    clearInterval(timerInterval); 

    textInput.focus();

    if (currentText.length > 0) {
        highlightCurrentChar(0);
    }

    statsDiv.classList.remove('show'); 
}

function highlightCurrentChar(charIndex) {
    const allChars = textDisplay.querySelectorAll('span');
    allChars.forEach((span, index) => {
        span.classList.remove('current');
    });

    if (charIndex < allChars.length) {
        allChars[charIndex].classList.add('current');
    }
}

function normalizeChar(char) {
    switch (char) {
        case 'أ': case 'إ': case 'آ': case 'ا': case '1': 
            return 'ا';
        case 'ى': case 'ي':
            return 'ي';
        case 'ؤ': case 'و':
            return 'و';
        case 'ه': case 'ة': 
            return 'ه'; 
        default:
            return char;
    }
}

function handleTyping(event) {
    const typedText = textInput.value;
    const currentTypedChar = typedText.slice(-1); 
    const currentCharIndex = typedText.length - 1; 

    if (currentText.length === 0) {
        return; 
    }

    if (!isTypingStarted) {
        isTypingStarted = true;
        startTime = new Date().getTime();
        timerInterval = setInterval(updateTimer, 1000); 
    }

    if (typedText.length > 0 && currentCharIndex < currentText.length) {
        const expectedChar = currentText[currentCharIndex];
        const charSpan = textDisplay.querySelectorAll('span')[currentCharIndex];

        const normalizedTypedChar = normalizeChar(currentTypedChar);
        const normalizedExpectedChar = normalizeChar(expectedChar);

        if (normalizedTypedChar === normalizedExpectedChar) {
            charSpan.classList.remove('incorrect');
            charSpan.classList.add('correct');
            correctCharacters++;
        } else {
            charSpan.classList.remove('correct');
            charSpan.classList.add('incorrect');
            errors++;
        }
    }
    else if (typedText.length < currentText.length) {
        const allChars = textDisplay.querySelectorAll('span');
        for (let i = typedText.length; i < allChars.length; i++) {
            allChars[i].classList.remove('correct', 'incorrect', 'current');
        }
        correctCharacters = 0;
        errors = 0;
        for (let i = 0; i < typedText.length; i++) {
            const normalizedTyped = normalizeChar(typedText[i]);
            const normalizedExpected = normalizeChar(currentText[i]);
            if (normalizedTyped === normalizedExpected) {
                correctCharacters++;
            } else {
                errors++;
            }
        }
        typedCharacters = typedText.length; 
    }

    highlightCurrentChar(typedText.length);

    const currentSpan = textDisplay.querySelector('span.current');
    if (currentSpan) {
        currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (typedText.length === currentText.length) {
        clearInterval(timerInterval); 
        updateStats(); 
        isTypingStarted = false; 
        textInput.disabled = true; 
        statsDiv.classList.add('show'); 
    }
}

function updateTimer() {
    const currentTime = new Date().getTime();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); 
    timerSpan.textContent = elapsedTime;
}

function updateStats() {
    const elapsedTimeInMinutes = (new Date().getTime() - startTime) / 1000 / 60; 
    let wpm = 0;
    if (elapsedTimeInMinutes > 0) {
        wpm = Math.round((correctCharacters / 5) / elapsedTimeInMinutes);
    }
    wpmSpan.textContent = wpm;
}

textInput.addEventListener('input', handleTyping);

restartButton.addEventListener('click', () => {
    textInput.disabled = false; 
    initializeTest(); 
});

initializeTest();
