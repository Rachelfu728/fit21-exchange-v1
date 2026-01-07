
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");

// ✅ 之後要開新一波活動（例如下個月），改這行就會重置一次機會
const CAMPAIGN_ID = "fit21-week1-v1";
const STORAGE_KEY = `fit21_spin_once_${CAMPAIGN_ID}`;

function getSavedSpin() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}
function saveSpin(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function applyLockIfSpun() {
  const saved = getSavedSpin();
  if (!saved) return;
  spinBtn.disabled = true;
  resultEl.textContent = `✅ 你已經轉過囉：${saved.prize}\n請把上次截圖傳給教練即可 🎁`;
}

// ✅ 直接沿用你原本放在 spin/assets 的圖片（不動原本代換表）
const IMG_BASE = "../spin/assets/";

const segments = [
  { label: "蛋白質棒 ×1", img: IMG_BASE + "reward_snackbar_512.png" },
  { label: "活力錠 ×1", img: IMG_BASE + "reward_liftoff_512.png" },
  { label: "優護飲 ×1包", img: IMG_BASE + "reward_wellnessplus_512.png" },
  { label: "全家美式咖啡 ×1杯", img: IMG_BASE + "reward_coffee_512.png" },
  { label: "現金獎 NT$100", img: IMG_BASE + "reward_cash100_512.png" },
  { label: "爆脂茶 ×1份（特別獎）", img: IMG_BASE + "reward_fatburntea_512.png" },
  { label: "賀寶芙顧客日門票 ×1張", img: IMG_BASE + "reward_customerday_ticket_512.png" },
];

const imgs = [];
let rotation = 0;
let isSpinning = false;

function loadImages() {
  return Promise.all(
    segments.map((s, i) => new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => { imgs[i] = im; resolve(); };
      im.onerror = reject;
      im.src = s.img;
    }))
  );
}

function drawWheel() {
  const { width, height } = canvas;
  const cx = width / 2, cy = height / 2;
  const radius = Math.min(cx, cy) - 10;
  const n = segments.length;
  const step = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  for (let i = 0; i < n; i++) {
    const start = i * step;
    const end = start + step;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = (i % 2 === 0) ? "#EEF6F0" : "#F5F5F5";
    ctx.fill();
    ctx.strokeStyle = "#D7D7D7";
    ctx.lineWidth = 3;
    ctx.stroke();

    const mid = start + step / 2;
    const dist = radius * 0.62;
    const iconSize = 150;

    const x = Math.cos(mid) * dist;
    const y = Math.sin(mid) * dist;

    const im = imgs[i];
    if (im) ctx.drawImage(im, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
  }

  ctx.restore();

  // 指針
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -radius - 2);
  ctx.lineTo(-26, -radius + 40);
  ctx.lineTo(26, -radius + 40);
  ctx.closePath();
  ctx.fillStyle = "#1f7a3a";
  ctx.fill();
  ctx.restore();

  // 中心圓
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#D7D7D7";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#1f7a3a";
  ctx.font = "bold 30px system-ui, -apple-system, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("轉", cx, cy - 18);
  ctx.fillText("一", cx, cy + 18);
}

function pickIndexByRotation(rot) {
  const n = segments.length;
  const step = (Math.PI * 2) / n;
  const pointerAngle = -Math.PI / 2;

  let a = (pointerAngle - rot) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;

  return Math.floor(a / step);
}

function spin() {
  if (isSpinning) return;

  if (getSavedSpin()) {
    applyLockIfSpun();
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = "轉盤啟動中…";

  const extraTurns = 6 + Math.random() * 3;
  const target = Math.random() * Math.PI * 2;
  const startRot = rotation;
  const endRot = startRot + extraTurns * Math.PI * 2 + target;

  const duration = 3800;
  const startTime = performance.now();

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function anim(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    rotation = startRot + (endRot - startRot) * eased;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(anim);
    } else {
      const idx = pickIndexByRotation(rotation);
      const prize = segments[idx].label;

      saveSpin({ prize, time: Date.now() });

      resultEl.textContent = `🎉 恭喜你抽到：${prize}\n請截圖回傳給教練領取 🎁`;
      spinBtn.disabled = true;
      isSpinning = false;
    }
  }

  requestAnimationFrame(anim);
}

spinBtn.addEventListener("click", spin);

loadImages()
  .then(() => { drawWheel(); applyLockIfSpun(); })
  .catch(() => { resultEl.textContent = "圖片載入失敗：請確認 spin/assets 裡的檔名是否正確。"; });
