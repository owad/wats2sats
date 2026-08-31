const BLOCK_REWARD_BTC = 3.125; // do następnego halvingu (~2028)
const BLOCKS_PER_DAY = 144;

let networkHashrateHs = null;
let networkDifficulty = null;
let btcPrices = null; // { usd, eur, pln }

function numberLocale() {
  return currentLang === "pl" ? "pl-PL" : "en-US";
}

function formatNumber(n, digits = 0) {
  return n.toLocaleString(numberLocale(), { maximumFractionDigits: digits });
}

async function fetchNetworkHashrate() {
  const netInfo = document.getElementById("net-info");
  try {
    const res = await fetch("https://mempool.space/api/v1/mining/hashrate/3d");
    const data = await res.json();
    networkHashrateHs = data.currentHashrate;
    networkDifficulty = data.currentDifficulty;
    netInfo.textContent = t("net_info", (networkHashrateHs / 1e18).toFixed(1), (networkDifficulty / 1e12).toFixed(2));
  } catch (e) {
    netInfo.textContent = t("net_info_error");
  }
  calculate();
}

async function fetchBtcPrice() {
  const priceInfo = document.getElementById("price-info");
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,pln");
    const data = await res.json();
    btcPrices = data.bitcoin;
    priceInfo.textContent = t("price_info", formatNumber(btcPrices.usd), formatNumber(btcPrices.eur), formatNumber(btcPrices.pln));
  } catch (e) {
    priceInfo.textContent = t("price_info_error");
  }
  calculate();
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

function formatValue(btcAmount) {
  if (!btcPrices) return "–";
  const usd = btcAmount * btcPrices.usd;
  const eur = btcAmount * btcPrices.eur;
  const pln = btcAmount * btcPrices.pln;
  return `$${formatNumber(usd, 2)} / €${formatNumber(eur, 2)} / ${formatNumber(pln, 2)} zł`;
}

function renderMiners(maxWatts) {
  const container = document.getElementById("miners-table");
  const sorted = [...MINERS].sort((a, b) => a.watts - b.watts);

  const rows = sorted.map(m => {
    const fits = maxWatts > 0 && m.watts <= maxWatts;
    const units = fits ? Math.floor(maxWatts / m.watts) : 0;
    // przy dopasowaniu liczymy dla tylu sztuk, ile zmieści się w mocy; inaczej dla jednej
    const hs = (fits ? units : 1) * m.hashrateThs * 1e12;
    const result = calcSatsPerDay(hs);
    const satsDay = result ? formatNumber(result.satsPerDay) : "–";
    const unitsLabel = fits && units > 1 ? ` <span class="units">×${units}</span>` : "";
    return `<tr class="${fits ? "" : "no-fit"}">
      <td>${m.name}${unitsLabel}</td>
      <td>${formatNumber(m.watts)} W</td>
      <td>${m.hashrateThs} TH/s</td>
      <td>${formatNumber(grossPricePln(m))} zł</td>
      <td>$${pricePerTh(m).toFixed(0)}</td>
      <td>${satsDay}</td>
      <td>${formatPayback(paybackDays(m))}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `<table>
    <thead><tr><th>${t("table_model")}</th><th>${t("table_watts")}</th><th>${t("table_hashrate")}</th><th>${t("table_price_gross")}</th><th>${t("table_price_th")}</th><th>${t("table_sats_day")}</th><th>${t("table_payback")}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="hint">${t("payback_disclaimer")}</p>
  <p class="hint">${maxWatts > 0 ? t("table_legend", formatNumber(maxWatts)) : t("miners_table_empty")}</p>`;
}

function updateOneBtcInfo(efficiency) {
  const oneBtcBox = document.getElementById("one-btc-info");
  if (!oneBtcBox) return;
  const wattsFor1Btc = efficiency > 0 ? wattsNeededFor1BtcPerDay(efficiency) : null;
  if (wattsFor1Btc) {
    oneBtcBox.textContent = t("one_btc_info", efficiency, formatNumber(wattsFor1Btc), formatNumber(wattsFor1Btc / 1e6, 2));
  } else {
    oneBtcBox.textContent = "";
  }
}

function minerEfficiency(m) {
  return m.watts / m.hashrateThs;
}

function pricePerTh(m) {
  return m.priceUsd / m.hashrateThs;
}

function grossPricePln(m) {
  const usdToPln = btcPrices ? btcPrices.pln / btcPrices.usd : 4.0;
  return m.priceUsd * usdToPln;
}

// Zwraca liczbę dni do zwrotu inwestycji przy założeniu darmowego prądu.
// Niezależne od liczby sztuk — koszt i przychód skalują się tak samo.
function paybackDays(m) {
  if (!networkHashrateHs || !btcPrices) return null;
  const result = calcSatsPerDay(m.hashrateThs * 1e12);
  if (!result) return null;
  const dailyValuePln = result.btcPerDay * btcPrices.pln;
  if (dailyValuePln <= 0) return null;
  return grossPricePln(m) / dailyValuePln;
}

function formatPayback(days) {
  if (days == null || !isFinite(days)) return "–";
  if (days < 1) return t("payback_lt_day");
  if (days > 3650) return t("payback_gt_10y");
  return t("payback_days", formatNumber(days));
}

function findBestValueCombo(watts) {
  // Najlepsza opcja = maksymalna łączna moc obliczeniowa (TH/s) osiągalna
  // z dostępnych watów. Przy remisie wygrywa mniej zmarnowanych watów,
  // a potem niższa cena za TH.
  let best = null;
  for (const m of MINERS) {
    if (m.watts > watts) continue;
    const units = Math.floor(watts / m.watts);
    if (units < 1) continue;
    const totalHs = units * m.hashrateThs;
    const wasted = watts - units * m.watts;
    const perTh = pricePerTh(m);
    if (
      !best ||
      totalHs > best.totalHs ||
      (totalHs === best.totalHs && wasted < best.wasted) ||
      (totalHs === best.totalHs && wasted === best.wasted && perTh < best.perTh)
    ) {
      best = { miner: m, units, totalHs, wasted, perTh };
    }
  }
  return best;
}

function updateBestValueBox(watts) {
  const box = document.getElementById("best-value-box");
  const best = watts > 0 ? findBestValueCombo(watts) : null;
  if (!best) {
    box.classList.add("hidden");
    return;
  }
  document.getElementById("best-value-text").textContent =
    t("best_value", best.units, best.miner.name, formatNumber(best.totalHs, 2));
  box.classList.remove("hidden");
  box.dataset.minerName = best.miner.name;
}

function populateMinerSelect(maxWatts) {
  const select = document.getElementById("miner");
  const hint = document.getElementById("miner-hint");
  const previous = select.value;

  const fitting = MINERS.filter(m => !maxWatts || m.watts <= maxWatts).sort((a, b) => a.watts - b.watts);

  const options = fitting.map(m =>
    `<option value="${m.name}">${formatNumber(m.watts)} W, ${m.hashrateThs} TH/s (${minerEfficiency(m).toFixed(1)} J/TH) — ${m.name}</option>`
  ).join("");

  select.innerHTML = `<option value="custom">${t("custom_efficiency")}</option>` + options;

  // zachowaj wybór, jeśli dalej mieści się w mocy
  if (previous && [...select.options].some(o => o.value === previous)) {
    select.value = previous;
  }

  if (!maxWatts) {
    hint.textContent = t("miner_hint_empty");
  } else if (fitting.length === 0) {
    hint.textContent = t("miner_hint_none", formatNumber(maxWatts));
  } else {
    hint.textContent = t("miner_hint_count", fitting.length);
  }

  toggleCustomEfficiency();
  updateBestValueBox(maxWatts);
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
    setupLabel = t("setup_custom", efficiency);
  }

  const result = calcSatsPerDay(hashrateHs);

  if (result) {
    document.getElementById("r-setup").textContent = setupLabel;
    document.getElementById("r-used-watts").textContent =
      `${formatNumber(usedWatts)} W / ${formatNumber(watts)} W`;
    document.getElementById("r-hashrate").textContent = `${formatNumber(hashrateHs / 1e12, 2)} TH/s`;
    document.getElementById("r-btc-day").textContent = result.btcPerDay.toFixed(8);
    document.getElementById("r-sats-day").textContent = formatNumber(result.satsPerDay);
    document.getElementById("r-sats-month").textContent = formatNumber(result.satsPerDay * 30);
    document.getElementById("r-value-day").textContent = formatValue(result.btcPerDay);
    document.getElementById("r-value-month").textContent = formatValue(result.btcPerDay * 30);
    document.getElementById("r-share").textContent = `${(result.share * 100).toExponential(2)}%`;
    const paybackRow = document.getElementById("r-payback-row");
    if (miner) {
      document.getElementById("r-payback").textContent = formatPayback(paybackDays(miner));
      paybackRow.classList.remove("hidden");
    } else {
      paybackRow.classList.add("hidden");
    }
    resultBox.classList.remove("hidden");
  }

  renderMiners(watts);
}

function onWattsChanged(watts) {
  populateMinerSelect(watts > 0 ? watts : 0);
  calculate();
}

function onLanguageChanged() {
  populateMinerSelect(parseFloat(document.getElementById("watts").value) || 0);
  calculate();
  if (networkHashrateHs) {
    document.getElementById("net-info").textContent = t("net_info", (networkHashrateHs / 1e18).toFixed(1), (networkDifficulty / 1e12).toFixed(2));
  }
  if (btcPrices) {
    document.getElementById("price-info").textContent = t("price_info", formatNumber(btcPrices.usd), formatNumber(btcPrices.eur), formatNumber(btcPrices.pln));
  }
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
document.getElementById("best-value-use").addEventListener("click", () => {
  const name = document.getElementById("best-value-box").dataset.minerName;
  if (name) {
    document.getElementById("miner").value = name;
    toggleCustomEfficiency();
    calculate();
  }
});

populateMinerSelect(0);
fetchNetworkHashrate();
fetchBtcPrice();
renderMiners(0);
