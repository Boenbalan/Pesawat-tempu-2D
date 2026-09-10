// Ganti URL di bawah ini dengan URL hasil Deploy Google Apps Script Anda
const GOOGLE_SCRIPT_URL = "URL_GOOGLE_APPS_SCRIPT_ANDA_DI_SINI";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Element UI
const uiOverlay = document.getElementById("uiOverlay");
const gameTitle = document.getElementById("gameTitle");
const gameMessage = document.getElementById("gameMessage");
const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const leaderboardList = document.getElementById("leaderboardList");

// Variabel State Game
let isPlaying = false;
let score = 0;
let level = 1;
let playerName = "";
let animationId;

// Player (Pesawat Pemain)
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0
};

// Array Game Objects
let bullets = [];
let enemies = [];

// Input Control
const keys = {
    right: false,
    left: false,
    space: false
};

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right") keys.right = true;
    if (e.key === "ArrowLeft" || e.key === "Left") keys.left = true;
    if (e.key === " " || e.code === "Space") {
        if (!keys.space && isPlaying) shootBullet();
        keys.space = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right") keys.right = false;
    if (e.key === "ArrowLeft" || e.key === "Left") keys.left = false;
    if (e.key === " " || e.code === "Space") keys.space = false;
});

function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 7
    });
}

function spawnEnemy() {
    if (!isPlaying) return;
    const size = 25;
    const x = Math.random() * (canvas.width - size);
    const speed = 1 + level * 0.5; // Kecepatan musuh bertambah sesuai level
    enemies.push({ x, y: -size, width: size, height: size, speed });

    // Spawn berulang
    const nextSpawn = Math.max(500, 1500 - level * 100);
    setTimeout(spawnEnemy, nextSpawn);
}

function update() {
    if (!isPlaying) return;

    // Gerakan Pemain
    if (keys.right && player.x + player.width < canvas.width) player.x += player.speed;
    if (keys.left && player.x > 0) player.x -= player.speed;

    // Update Peluru
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Update Musuh & Deteksi Tabrakan
    enemies.forEach((enemy, eIndex) => {
        enemy.y += enemy.speed;

        // Cek tabrakan Musuh vs Pemain (Game Over)
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            gameOver();
        }

        // Musuh melewai batas bawah
        if (enemy.y > canvas.height) {
            enemies.splice(eIndex, 1);
        }

        // Cek tabrakan Peluru vs Musuh
        bullets.forEach((bullet, bIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Musuh hancur
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;

                // Naik level setiap kelipatan 20 Poin
                if (score >= level * 20) {
                    level++;
                }
            }
        });
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
        // Draw Player (Segitiga Biru)
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.fill();

        // Draw Peluru (Kuning)
        ctx.fillStyle = "#facc15";
        bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Draw Musuh (Merah)
        ctx.fillStyle = "#ef4444";
        enemies.forEach(enemy => {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });

        // Draw Scoreboard / HUD
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.fillText(`Pemain: ${playerName}`, 10, 20);
        ctx.fillText(`Skor: ${score}`, 10, 40);
        ctx.fillText(`Stage / Level: ${level}`, 10, 60);
    }
}

function gameLoop() {
    update();
    draw();
    if (isPlaying) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    playerName = playerNameInput.value.trim() || "Player";
    score = 0;
    level = 1;
    bullets = [];
    enemies = [];
    player.x = canvas.width / 2 - 15;
    isPlaying = true;

    uiOverlay.style.display = "none";
    spawnEnemy();
    gameLoop();
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);

    // Kirim skor ke Google Sheet
    sendScoreToGoogleSheet(playerName, score);

    // Tampilkan UI Game Over
    gameTitle.innerText = "GAME OVER";
    gameMessage.innerText = `Skor Akhir Anda: ${score} (Stage ${level})`;
    startBtn.innerText = "Main Lagi";
    uiOverlay.style.display = "flex";

    // Refresh Leaderboard
    fetchLeaderboard();
}

// Integrasi Leaderboard Google Sheets
function sendScoreToGoogleSheet(nama, skor) {
    if (GOOGLE_SCRIPT_URL === "URL_GOOGLE_APPS_SCRIPT_ANDA_DI_SINI") return;

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama, skor: skor })
    }).catch(err => console.error("Gagal mengirim skor:", err));
}

function fetchLeaderboard() {
    if (GOOGLE_SCRIPT_URL === "URL_GOOGLE_APPS_SCRIPT_ANDA_DI_SINI") {
        leaderboardList.innerHTML = "<li>URL Apps Script Belum Dipasang</li>";
        return;
    }

    fetch(GOOGLE_SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            leaderboardList.innerHTML = "";
            if (data.length === 0) {
                leaderboardList.innerHTML = "<li>Belum ada data</li>";
                return;
            }
            data.forEach(item => {
                const li = document.createElement("li");
                li.innerText = `${item.nama} - ${item.skor} Pts`;
                leaderboardList.appendChild(li);
            });
        })
        .catch(() => {
            leaderboardList.innerHTML = "<li>Gagal memuat data</li>";
        });
}

// Listener & Inisialisasi awal
startBtn.addEventListener("click", startGame);
fetchLeaderboard();
