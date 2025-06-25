// util: format YYYY-MM-DD to Date (local, no TZ issues)
const strToDate = (s) => new Date(s + "T00:00:00");
const dateToStr = (d) => d.toISOString().substring(0, 10);
const STORAGE_KEY = "pomodoros";
let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

const weekBoard = document.getElementById("weekBoard");
const dayTmpl = document.getElementById("dayTemplate");
const entryTmpl = document.getElementById("entryTemplate");
const entryDialog = document.getElementById("entryDialog");
const entryForm = document.getElementById("entryForm");
const weekLabel = document.getElementById("weekLabel");

// find Monday of current week
let currentMonday = (() => {
  const today = new Date();
  const day = (today.getDay() + 6) % 7; // Mon=0 .. Sun=6
  today.setDate(today.getDate() - day);
  today.setHours(0, 0, 0, 0);
  return today;
})();

function render() {
  weekBoard.innerHTML = "";
  const weekStart = new Date(currentMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekLabel.textContent = `${dateToStr(weekStart)} – ${dateToStr(weekEnd)}`;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dayStr = dateToStr(dayDate);
    const dayNode = dayTmpl.content.cloneNode(true);

    const section = dayNode.querySelector(".day");
    section.dataset.date = dayStr;
    dayNode.querySelector(".dayName").textContent = dayDate.toLocaleDateString(undefined, { weekday: "long" });

    const entries = data[dayStr] || [];
    const list = dayNode.querySelector(".entryList");
    let dayTotal = 0;
    entries.forEach((e) => {
      const li = entryTmpl.content.cloneNode(true);
      li.querySelector(".project").textContent = e.project;
      li.querySelector(".desc").textContent = e.description;
      li.querySelector(".cnt").textContent = e.count;
      li.querySelector(".del").addEventListener("click", () => {
        removeEntry(dayStr, e.id);
      });
      list.appendChild(li);
      dayTotal += Number(e.count);
    });
    dayNode.querySelector(".dayTotal").textContent = dayTotal;

    dayNode.querySelector(".addEntry").addEventListener("click", () => openDialog(dayStr));
    weekBoard.appendChild(dayNode);
  }
}

function openDialog(dateStr) {
  entryForm.reset();
  entryForm.date.value = dateStr;
  entryDialog.showModal();
}

entryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(entryForm);
  const obj = Object.fromEntries(fd.entries());
  obj.id = crypto.randomUUID();
  obj.count = Number(obj.count) || 1;
  addEntry(obj.date, obj);
  entryDialog.close();
});

function addEntry(day, entry) {
  if (!data[day]) data[day] = [];
  data[day].push(entry);
  save();
  render();
}

function removeEntry(day, id) {
  data[day] = data[day].filter((e) => e.id !== id);
  if (data[day].length === 0) delete data[day];
  save();
  render();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Week navigation
document.getElementById("prevWeek").onclick = () => {
  currentMonday.setDate(currentMonday.getDate() - 7);
  render();
};
document.getElementById("nextWeek").onclick = () => {
  currentMonday.setDate(currentMonday.getDate() + 7);
  render();
};

// Export / import
const exportBtn = document.getElementById("exportBtn");
exportBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pomodoros-${dateToStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importInput = document.getElementById("importFile");
document.getElementById("importBtn").onclick = () => importInput.click();
importInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const obj = JSON.parse(ev.target.result);
      if (typeof obj === "object") {
        data = obj;
        save();
        render();
      } else alert("Invalid JSON");
    } catch (err) {
      alert("Failed to import: " + err.message);
    }
  };
  reader.readAsText(file);
  importInput.value = ""; // reset
};

// initial render
render();
