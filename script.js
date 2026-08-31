const BLOCK_REWARD_BTC = 3.125; // do następnego halvingu (~2028)
const BLOCKS_PER_DAY = 144;

let networkHashrateHs = null;
let networkDifficulty = null;

async function fetchNetworkHashrate() {
  const netInfo = document.getElementById("net-info");
  try {
    const res = await fetch("https://mempool.space/api/v1/mining/hashrate/3d");
    const data = await res.json();
    networkHashrateHs = data.currentHashrate;
    networkDifficulty = data.currentDifficulty;
    const netInEHs = networkHashrateHs / 1e18;
    const diffInT = networkDifficulty / 1e12;
    netInfo.textContent = `Sieć Bitcoin na żywo: ~${netInEHs.toFixed(1)} EH/s, trudność ~${diffInT.toFixed(2)} T (mempool.space)`;
  } catch (e) {
    netInfo.textContent = "Nie udało się pobrać aktualnego hashrate/trudności sieci — spróbuj odświeżyć stronę.";
  }
  calculate();
}

function formatNumber(n, digits = 0) {
  return n.toLocaleString("pl-PL", { maximumFractionDigits: digits });
}

function hashesPerSecondFromWatts(watts, efficiencyJPerTh) {
  const th = watts / efficiencyJPerTh;
  return th * 1e12;
}

function calcSatsPerDay(hashrateHs) {
  if (!networkHashrateHs) return null;
  const share = hashrateHs / networkHashrateHs;
  const btcPerDay = share * BLOCKS_PER_DAY * BLOCK_REWARD_BTC;
  return { btcPerDay, satsPerDay: btcPerDay * 1e8, share };
}

function wattsNeededFor1BtcPerDay(efficiencyJPerTh) {
  if (!networkHashrateHs) return null;
  const share = 1 / (BLOCKS_PER_DAY * BLOCK_REWARD_BTC);
  const hashrateNeededHs = share * networkHashrateHs;
  const thNeeded = hashrateNeededHs / 1e12;
  return thNeeded * efficiencyJPerTh;
}

function renderMiners(maxWatts) {
  const container = document.getElementById("miners-table");
  const fitting = MINERS.filter(m => !maxWatts || m.watts <= maxWatts).sort((a, b) => a.watts - b.watts);

  if (!maxWatts) {
    container.innerHTML = `<p class="hint">Wpisz dostępną moc powyżej, żeby zobaczyć pasujące koparki.</p>`;
    return;
  }
  if (fitting.length === 0) {
    container.innerHTML = `<p class="hint">Żadna z uwzględnionych koparek nie mieści się w ${formatNumber(maxWatts)} W.</p>`;
    return;
  }

  const rows = fitting.map(m => {
    const hs = m.hashrateThs * 1e12;
    const result = calcSatsPerDay(hs);
    const satsDay = result ? formatNumber(result.satsPerDay) : "–";
    return `<tr>
      <td>${m.name}</td>
      <td>${formatNumber(m.watts)} W</td>
      <td>${m.hashrateThs} TH/s</td>
      <td>${satsDay}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `<table>
    <thead><tr><th>Model</th><th>Pobór</th><th>Hashrate</th><th>Sats/dzień</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function updateOneBtcInfo(efficiency) {
  const oneBtcBox = document.getElementById("one-btc-info");
  if (!oneBtcBox) return;
  const wattsFor1Btc = efficiency > 0 ? wattsNeededFor1BtcPerDay(efficiency) : null;
  if (wattsFor1Btc) {
    oneBtcBox.textContent = `Przy ${efficiency} J/TH, żeby wykopać 1 BTC w 24h, potrzeba ~${formatNumber(wattsFor1Btc)} W (~${formatNumber(wattsFor1Btc / 1e6, 2)} MW) mocy obliczeniowej.`;
  } else {
    oneBtcBox.textContent = "";
  }
}

function minerEfficiency(m) {
  return m.watts / m.hashrateThs;
}

function populateMinerSelect(maxWatts) {
  const select = document.getElementById("miner");
  const hint = document.getElementById("miner-hint");
  const previous = select.value;

  const fitting = MINERS.filter(m => !maxWatts || m.watts <= maxWatts).sort((a, b) => a.watts - b.watts);

  const options = fitting.map(m =>
    `<option value="${m.name}">${m.name} — ${formatNumber(m.watts)} W, ${m.hashrateThs} TH/s (${minerEfficiency(m).toFixed(1)} J/TH)</option>`
  ).join("");

  select.innerHTML = `<option value="custom">Własna efektywność (J/TH)</option>` + options;

  // zachowaj wybór, jeśli dalej mieści się w mocy
  if (previous && [...select.options].some(o => o.value === previous)) {
    select.value = previous;
  }

  if (!maxWatts) {
    hint.textContent = "Wpisz dostępną moc, żeby zobaczyć koparki, które się w niej mieszczą.";
  } else if (fitting.length === 0) {
    hint.textContent = `Żadna z uwzględnionych koparek nie mieści się w ${formatNumber(maxWatts)} W — możesz podać własną efektywność.`;
  } else {
    hint.textContent = `${fitting.length} model(i) mieści się w ${formatNumber(maxWatts)} W.`;
  }

  toggleCustomEfficiency();
}

function toggleCustomEfficiency() {
  const isCustom = document.getElementById("miner").value === "custom";
  document.getElementById("custom-eff-wrap").style.display = isCustom ? "" : "none";
}

function calculate() {
  const watts = parseFloat(document.getElementById("watts").value);
  const resultBox = document.getElementById("result");
  const selectedName = document.getElementById("miner").value;
  const miner = MINERS.find(m => m.name === selectedName);

  const efficiency = miner
    ? minerEfficiency(miner)
    : parseFloat(document.getElementById("efficiency").value);

  updateOneBtcInfo(efficiency);

  if (!watts || watts <= 0 || !efficiency || efficiency <= 0) {
    resultBox.classList.add("hidden");
    renderMiners(0);
    return;
  }

  let hashrateHs;
  let usedWatts;
  let setupLabel;

  if (miner) {
    // ile sztuk zmieści się w dostępnej mocy
    const units = Math.floor(watts / miner.watts);
    if (units < 1) {
      resultBox.classList.add("hidden");
      renderMiners(watts);
      return;
    }
    hashrateHs = units * miner.hashrateThs * 1e12;
    usedWatts = units * miner.watts;
    setupLabel = `${units} × ${miner.name}`;
  } else {
    hashrateHs = hashesPerSecondFromWatts(watts, efficiency);
    usedWatts = watts;
    setupLabel = `${efficiency} J/TH (własna)`;
  }

  const result = calcSatsPerDay(hashrateHs);

  if (result) {
    document.getElementById("r-setup").textContent = setupLabel;
    document.getElementById("r-used-watts").textContent =
      `${formatNumber(usedWatts)} W z ${formatNumber(watts)} W`;
    document.getElementById("r-hashrate").textContent = `${formatNumber(hashrateHs / 1e12, 2)} TH/s`;
    document.getElementById("r-btc-day").textContent = result.btcPerDay.toFixed(8);
    document.getElementById("r-sats-day").textContent = formatNumber(result.satsPerDay);
    document.getElementById("r-sats-month").textContent = formatNumber(result.satsPerDay * 30);
    document.getElementById("r-share").textContent = `${(result.share * 100).toExponential(2)}%`;
    resultBox.classList.remove("hidden");
  }

  renderMiners(watts);
}

function onWattsChanged(watts) {
  populateMinerSelect(watts > 0 ? watts : 0);
  calculate();
}

document.getElementById("calc").addEventListener("click", calculate);
document.getElementById("watts").addEventListener("keydown", e => { if (e.key === "Enter") calculate(); });
document.getElementById("watts").addEventListener("input", () => {
  const w = parseFloat(document.getElementById("watts").value) || 0;
  const slider = document.getElementById("watts-slider");
  if (w <= parseFloat(slider.max)) slider.value = w;
  onWattsChanged(w);
});
document.getElementById("watts-slider").addEventListener("input", () => {
  const w = parseFloat(document.getElementById("watts-slider").value);
  document.getElementById("watts").value = w;
  onWattsChanged(w);
});
document.getElementById("miner").addEventListener("change", () => {
  toggleCustomEfficiency();
  calculate();
});
document.getElementById("efficiency").addEventListener("change", calculate);

populateMinerSelect(0);
fetchNetworkHashrate();
renderMiners(0);
