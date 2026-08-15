const API_URL = '/api/config';
let currentConfig = { allowedNumbers: [], triggerKeyword: '' };

const triggerInput = document.getElementById('triggerKeywordInput');
const phoneList = document.getElementById('phoneList');
const newPhoneInput = document.getElementById('newPhoneInput');

async function loadConfig() {
    try {
        const res = await fetch(API_URL);
        currentConfig = await res.json();
        render();
    } catch (err) {
        console.error('Failed to load config', err);
        showToast('Error loading configuration');
    }
}

async function saveConfig() {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentConfig)
        });
        currentConfig = await res.json();
        showToast('Settings Saved!');
        render();
    } catch (err) {
        console.error('Failed to save config', err);
        showToast('Error saving configuration');
    }
}

function render() {
    triggerInput.value = currentConfig.triggerKeyword;
    
    phoneList.innerHTML = '';
    if (currentConfig.allowedNumbers.length === 0) {
        phoneList.innerHTML = '<li class="phone-item" style="color: #64748b; font-style: italic;">No numbers added yet.</li>';
    } else {
        currentConfig.allowedNumbers.forEach(num => {
            const li = document.createElement('li');
            li.className = 'phone-item';
            
            const numSpan = document.createElement('span');
            numSpan.textContent = num;
            
            const btn = document.createElement('button');
            btn.className = 'remove-btn';
            btn.textContent = 'Remove';
            btn.onclick = () => {
                currentConfig.allowedNumbers = currentConfig.allowedNumbers.filter(n => n !== num);
                saveConfig();
            };
            
            li.appendChild(numSpan);
            li.appendChild(btn);
            phoneList.appendChild(li);
        });
    }
}

document.getElementById('saveTriggerBtn').onclick = () => {
    currentConfig.triggerKeyword = triggerInput.value;
    saveConfig();
};

document.getElementById('addPhoneBtn').onclick = () => {
    const num = newPhoneInput.value.trim();
    if (num && !currentConfig.allowedNumbers.includes(num)) {
        currentConfig.allowedNumbers.push(num);
        newPhoneInput.value = '';
        saveConfig();
    }
};

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// QR Code Polling
const STATUS_API_URL = '/api/status';
const qrSection = document.getElementById('qrSection');
const connectedSection = document.getElementById('connectedSection');
const qrImage = document.getElementById('qrImage');

async function checkStatus() {
    try {
        const res = await fetch(STATUS_API_URL);
        const data = await res.json();
        
        if (data.connected) {
            qrSection.style.display = 'none';
            connectedSection.style.display = 'block';
        } else if (data.qr) {
            qrImage.src = data.qr;
            qrSection.style.display = 'block';
            connectedSection.style.display = 'none';
        } else {
            qrSection.style.display = 'none';
            connectedSection.style.display = 'none';
        }
    } catch (err) {
        console.error('Failed to get status', err);
    }
}

// Poll status every 3 seconds
setInterval(checkStatus, 3000);
checkStatus();

// Initial load
loadConfig();
