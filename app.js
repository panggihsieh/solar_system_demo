const canvas = document.querySelector("#solar-system");
const context = canvas.getContext("2d");
const speedControl = document.querySelector("#speed");
const timelineControl = document.querySelector("#timeline");
const speedValue = document.querySelector("#speed-value");
const humanViewButton = document.querySelector("#human-view-button");
const humanViewIcon = document.querySelector("#human-view-icon");
const humanSpeedNote = document.querySelector("#human-speed-note");
const dateValue = document.querySelector("#date-value");
const playButton = document.querySelector("#play-button");
const playLabel = document.querySelector("#play-label");
const resetButton = document.querySelector("#reset-button");
const labelsToggle = document.querySelector("#labels-toggle");
const orbitsToggle = document.querySelector("#orbits-toggle");
const tooltip = document.querySelector("#planet-tooltip");
const tooltipName = document.querySelector("#tooltip-name");
const tooltipDetail = document.querySelector("#tooltip-detail");
const clock = document.querySelector("#clock");

const planets = [
  { name: "MERCURY", chineseName: "水星", radius: 0.18, size: 3, period: 88, color: "#a8a29e", start: 2.4 },
  { name: "VENUS", chineseName: "金星", radius: 0.29, size: 5, period: 225, color: "#e7b56e", start: 1.1 },
  { name: "EARTH", chineseName: "地球", radius: 0.41, size: 5.5, period: 365, color: "#7eb6ff", start: 4.5 },
  { name: "MARS", chineseName: "火星", radius: 0.53, size: 4.2, period: 687, color: "#dc8061", start: 2.8 },
  { name: "JUPITER", chineseName: "木星", radius: 0.69, size: 11, period: 4333, color: "#d6ad82", start: .3 },
  { name: "SATURN", chineseName: "土星", radius: 0.82, size: 9, period: 10759, color: "#e3d39b", start: 5.2, rings: true },
  { name: "URANUS", chineseName: "天王星", radius: 0.92, size: 7, period: 30687, color: "#92d5e0", start: 3.5 },
  { name: "NEPTUNE", chineseName: "海王星", radius: 1, size: 7, period: 60190, color: "#6f8ee8", start: .8 },
];

let simulationDay = 1;
let playing = true;
let humanPerspective = false;
let lastFrame = performance.now();
let renderedPlanets = [];
const humanIconFrames = [
  "assets/human-awake.png",
  "assets/human-active.png",
  "assets/human-asleep.png",
];
let humanIconFrame = 0;

function setRangeFill(input) {
  const percent = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--fill", `${percent}%`);
}

function updateControls() {
  const speed = Number(speedControl.value);
  speedValue.textContent = humanPerspective ? "實時 / REAL TIME" : `${speed.toFixed(1)}×`;
  dateValue.textContent = `DAY ${String(Math.round(simulationDay)).padStart(3, "0")}`;
  timelineControl.value = Math.round(simulationDay);
  speedControl.disabled = humanPerspective;
  humanViewButton.setAttribute("aria-pressed", String(humanPerspective));
  humanSpeedNote.hidden = !humanPerspective;
  setRangeFill(speedControl);
  setRangeFill(timelineControl);
  playButton.classList.toggle("playing", !playing);
  playLabel.textContent = playing ? "暫停 / Pause" : "播放 / Play";
}

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function draw() {
  const { width, height } = canvas.getBoundingClientRect();
  context.clearRect(0, 0, width, height);
  const centerX = width * .54;
  const centerY = height * .53;
  const maxRadius = Math.min(width, height) * .42;
  renderedPlanets = [];

  if (orbitsToggle.checked) {
    planets.forEach((planet) => {
      context.beginPath();
      context.ellipse(centerX, centerY, maxRadius * planet.radius, maxRadius * planet.radius * .54, -0.24, 0, Math.PI * 2);
      context.strokeStyle = "rgba(151, 177, 227, .18)";
      context.lineWidth = 1;
      context.stroke();
    });
  }

  const sunGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 38);
  sunGlow.addColorStop(0, "rgba(255, 221, 104, .96)");
  sunGlow.addColorStop(.25, "rgba(255, 184, 71, .42)");
  sunGlow.addColorStop(1, "rgba(255, 167, 45, 0)");
  context.fillStyle = sunGlow;
  context.beginPath();
  context.arc(centerX, centerY, 38, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(centerX, centerY, 10, 0, Math.PI * 2);
  context.fillStyle = "#ffd96c";
  context.shadowColor = "#ffc54c";
  context.shadowBlur = 15;
  context.fill();
  context.shadowBlur = 0;

  planets.forEach((planet) => {
    const angle = planet.start + (simulationDay / planet.period) * Math.PI * 2;
    const orbitX = maxRadius * planet.radius;
    const orbitY = orbitX * .54;
    const x = centerX + Math.cos(angle) * orbitX * Math.cos(-.24) - Math.sin(angle) * orbitY * Math.sin(-.24);
    const y = centerY + Math.cos(angle) * orbitX * Math.sin(-.24) + Math.sin(angle) * orbitY * Math.cos(-.24);
    renderedPlanets.push({ ...planet, x, y });

    if (planet.rings) {
      context.save();
      context.translate(x, y);
      context.rotate(-.3);
      context.strokeStyle = "rgba(227, 211, 155, .75)";
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(0, 0, planet.size * 1.8, planet.size * .55, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    context.beginPath();
    context.arc(x, y, planet.size, 0, Math.PI * 2);
    context.fillStyle = planet.color;
    context.shadowColor = planet.color;
    context.shadowBlur = 9;
    context.fill();
    context.shadowBlur = 0;

    if (labelsToggle.checked) {
      context.fillStyle = "rgba(208, 221, 244, .76)";
      context.font = '10px "DM Mono", monospace';
      context.letterSpacing = "1px";
      context.fillText(`${planet.chineseName} / ${planet.name}`, x + planet.size + 7, y - planet.size - 4);
    }
  });
}

function animate(time) {
  const elapsed = Math.min((time - lastFrame) / 1000, .1);
  lastFrame = time;
  if (playing) {
    const daysElapsed = humanPerspective
      ? elapsed / 86_400
      : elapsed * Number(speedControl.value) * 12;
    simulationDay = (simulationDay + daysElapsed) % 366;
    updateControls();
  }
  draw();
  requestAnimationFrame(animate);
}

speedControl.addEventListener("input", updateControls);
humanViewButton.addEventListener("click", () => {
  humanPerspective = !humanPerspective;
  updateControls();
});

setInterval(() => {
  if (!humanPerspective) {
    humanIconFrame = 0;
    humanViewIcon.src = humanIconFrames[humanIconFrame];
    return;
  }
  humanIconFrame = (humanIconFrame + 1) % humanIconFrames.length;
  humanViewIcon.src = humanIconFrames[humanIconFrame];
}, 850);
timelineControl.addEventListener("input", () => {
  simulationDay = Number(timelineControl.value);
  updateControls();
});
playButton.addEventListener("click", () => {
  playing = !playing;
  updateControls();
});
resetButton.addEventListener("click", () => {
  simulationDay = 1;
  speedControl.value = 1;
  playing = true;
  humanPerspective = false;
  updateControls();
});
[labelsToggle, orbitsToggle].forEach((input) => input.addEventListener("change", draw));

canvas.addEventListener("mousemove", (event) => {
  const bounds = canvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  const planet = renderedPlanets.find((item) => Math.hypot(item.x - x, item.y - y) < Math.max(item.size + 8, 13));
  if (!planet) {
    tooltip.hidden = true;
    canvas.style.cursor = "crosshair";
    return;
  }
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(x + 15, bounds.width - 135)}px`;
  tooltip.style.top = `${Math.max(y - 48, 45)}px`;
  tooltipName.textContent = `${planet.chineseName} / ${planet.name}`;
  tooltipDetail.textContent = `${planet.radius === 1 ? "30.1" : (planet.radius * 30).toFixed(1)} AU · ${planet.period.toLocaleString()} 天 / DAYS`;
  canvas.style.cursor = "pointer";
});
canvas.addEventListener("mouseleave", () => { tooltip.hidden = true; });
window.addEventListener("resize", () => { resizeCanvas(); draw(); });
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    playButton.click();
  }
});

setInterval(() => {
  clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
}, 1000);
resizeCanvas();
updateControls();
animate(performance.now());
