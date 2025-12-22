// public/script.js - BẢN SỬA LỖI VÀ TÍCH HỢP AUDIO HOÀN CHỈNH

// 👇👇👇 THAY ID CỦA BẠN VÀO ĐÂY 👇👇👇
const DISCORD_ID = '1240166487956918373'; 

const LANYARD_API = 'wss://api.lanyard.rest/socket';

// --- ELEMENT TARGETS ---
const preloader = document.getElementById('preloader'); 
const bgVideo = document.getElementById('background-video'); 
const bgAudio = document.getElementById('bg-music'); 
const volumeBtn = document.querySelector('.volume-control'); 
const volIcon = document.getElementById('volume-icon'); 

const mainAvatar = document.getElementById('main-avatar'); 
const discordPfp = document.getElementById('discord-pfp'); 
const usernameElement = document.getElementById('discord-username');
const statusText = document.getElementById('discord-status-text');
const activityIcon = document.getElementById('discord-activity-icon'); 
const faviconLink = document.getElementById('favicon-link');

let lanyardConnected = false;

// --- LANYARD CONNECTION LOGIC (Giữ nguyên) ---
function connectLanyard() {
    if (lanyardConnected) return;

    const socket = new WebSocket(LANYARD_API);

    socket.onopen = () => {
        console.log('Lanyard Connected');
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [DISCORD_ID] } }));
        lanyardConnected = true;
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const d = data.d;

        if (data.op === 1) {
            setInterval(() => { socket.send(JSON.stringify({ op: 3 })); }, d.heartbeat_interval);
        }

        if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
            const userData = d[DISCORD_ID] || d; 
            if (userData) updateProfile(userData);
        }
    };
    
    socket.onclose = () => {
        lanyardConnected = false;
        setTimeout(connectLanyard, 5000); 
    };
}

function updateProfile(data) {
    const user = data.discord_user;

    // 1. CẬP NHẬT AVATAR & TÊN
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`
        : 'assets/default-avatar.jpg';

    if (faviconLink) faviconLink.href = avatarUrl; 
    mainAvatar.src = avatarUrl;
    discordPfp.src = avatarUrl;
    usernameElement.textContent = user.username;

    // 2. CẬP NHẬT TRẠNG THÁI & ICON GAME
    const activities = data.activities || [];
    const activity = activities.find(a => a.type === 0 || a.type === 2);

    if (activity) {
        statusText.innerHTML = `Playing <strong>${activity.name}</strong>`;
        
        if (activity.assets && activity.assets.large_image) {
            let imgLink = '';
            if (activity.assets.large_image.startsWith('mp:')) {
                imgLink = `https://media.discordapp.net/${activity.assets.large_image.replace('mp:', '')}`;
            } else if (activity.assets.large_image.startsWith('spotify:')) {
                imgLink = `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`;
            } else {
                imgLink = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
            }
            activityIcon.src = imgLink;
            activityIcon.style.display = 'block'; 
        } else {
            activityIcon.style.display = 'none';
        }
    } else {
        const statusMap = { online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', offline: 'Offline' };
        statusText.textContent = statusMap[data.discord_status] || 'Offline';
        activityIcon.style.display = 'none'; 
    }
}


// --- PRELOADER & MEDIA HANDLING ---

function handleEnter() {
    // 1. Ẩn màn hình chờ
    preloader.classList.add('hidden');
    document.body.classList.add('loaded'); 
    
    // --- BỔ SUNG: TẢI TRẠNG THÁI ÂM THANH ĐÃ LƯU ---
    // Mặc định là bật tiếng (false) nếu chưa có trạng thái lưu nào.
    let shouldBeMuted = false; 
    const savedMuted = localStorage.getItem('volumeMuted');

    if (savedMuted === 'false') {
        shouldBeMuted = false; 
    } 
    
    // 2. ÁP DỤNG TRẠNG THÁI & KÍCH HOẠT VIDEO/AUDIO
    
    // Video: Áp dụng trạng thái đã lưu
    bgVideo.muted = shouldBeMuted;
    bgVideo.play().catch(e => {
        console.error("Video playback failed on interaction. Error:", e);
        bgVideo.muted = true; // Nếu lỗi, buộc mute
        bgVideo.play().catch(err => console.error("Video muted playback error:", err));
    });
    
    // Audio: Áp dụng trạng thái đã lưu
    if (bgAudio) {
        bgAudio.muted = shouldBeMuted;
        bgAudio.play().catch(e => console.error("Audio playback failed on interaction. Error:", e));
    }
    
    // 3. CẬP NHẬT ICON
    if (shouldBeMuted) {
        volIcon.className = "fas fa-volume-mute";
    } else {
        volIcon.className = "fas fa-volume-up";
    }
}


// --- CHỨC NĂNG ÂM THANH (LƯU TRẠNG THÁI) ---
function toggleMute() {
    // Đảo trạng thái Mute chung
    var newMutedState = !bgVideo.muted;

    // 1. Áp dụng cho Video và Audio
    bgVideo.muted = newMutedState;
    if (bgAudio) bgAudio.muted = newMutedState;

    // 2. LƯU TRẠNG THÁI VÀO LOCALSTORAGE
    localStorage.setItem('volumeMuted', newMutedState);

    // 3. Đổi icon
    if (newMutedState) {
        volIcon.className = "fas fa-volume-mute";
    } else {
        volIcon.className = "fas fa-volume-up";
        // Nếu bật tiếng, đảm bảo cả hai đều phát (để khôi phục sau khi mute)
        if (bgVideo.paused) bgVideo.play();
        if (bgAudio && bgAudio.paused) bgAudio.play().catch(e => console.error("Could not resume audio:", e));
    }
}


// KHỞI ĐỘNG HỆ THỐNG
document.addEventListener('DOMContentLoaded', connectLanyard);

document.addEventListener('DOMContentLoaded', () => {
    if (volumeBtn) {
        volumeBtn.addEventListener('click', toggleMute);
    }
});