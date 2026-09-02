function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-toggle").textContent = theme === "light" ? "☀️" : "🌙";
  document.getElementById("logo-img").src = theme === "light"
    ? "assets/wats2sats-logo-na-jasne-tlo.svg"
    : "assets/wats2sats-logo-na-ciemne-tlo.svg";
}

let currentTheme = localStorage.getItem("wats2sats_theme")
  || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
applyTheme(currentTheme);

document.getElementById("theme-toggle").addEventListener("click", () => {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("wats2sats_theme", currentTheme);
  applyTheme(currentTheme);
});

const BLOCK_REWARD_BTC = 3.125; // do następnego halvingu (~2028)
const BLOCKS_PER_DAY = 144;

let networkHashrateHs = null; // obserwowany hashrate sieci (3d avg, do wyświetlenia)
let networkDifficulty = null;
let networkHashrateExpected = null; // wyliczony z trudności — używany do obliczeń (wartość oczekiwana, niezależna od chwilowego "szczęścia" sieci)
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
    // Trudność -> oczekiwany hashrate sieci (diff * 2^32 / 600s) — kanoniczna wartość oczekiwana,
    // dokładniejsza niż chwilowy obserwowany hashrate (ten potrafi odbiegać o kilka % dzień do dnia).
    networkHashrateExpected = networkDifficulty * Math.pow(2, 32) / 600;
    netInfo.textContent = t("net_info", (networkHashrateHs / 1e18).toFixed(1), (networkDifficulty / 1e12).toFixed(2));
  } catch (e) {
    netInfo.textContent = t("net_info_error");
  }
  calculate();
}

async function fetchBtcPriceFromCoingecko() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,pln");
  const data = await res.json();
  if (!data.bitcoin || !data.bitcoin.usd || !data.bitcoin.pln) throw new Error("incomplete coingecko response");
  return data.bitcoin;
}

// CoinGecko bywa blokowany przez adblockery/DNS-filtry — mempool.space + kurs walut jako zapasowe źródło.
async function fetchBtcPriceFallback() {
  const [mempoolRes, fxRes] = await Promise.all([
    fetch("https://mempool.space/api/v1/prices"),
    fetch("https://api.frankfurter.dev/v1/latest?from=USD&to=PLN,EUR"),
  ]);
  const mempool = await mempoolRes.json();
  const fx = await fxRes.json();
  if (!mempool.USD || !fx.rates || !fx.rates.PLN) throw new Error("incomplete fallback response");
  return {
    usd: mempool.USD,
    eur: mempool.USD * fx.rates.EUR,
    pln: mempool.USD * fx.rates.PLN,
  };
}

async function fetchBtcPrice() {
  const priceInfo = document.getElementById("price-info");
  try {
    btcPrices = await fetchBtcPriceFromCoingecko();
  } catch (e) {
    try {
      btcPrices = await fetchBtcPriceFallback();
    } catch (e2) {
      priceInfo.textContent = t("price_info_error");
      calculate();
      return;
    }
  }
  priceInfo.textContent = t("price_info", formatMoney(btcPrices[activeCurrency()], 0));
  calculate();
}

function hashesPerSecondFromWatts(watts, efficiencyJPerTh) {
  const th = watts / efficiencyJPerTh;
  return th * 1e12;
}

function calcSatsPerDay(hashrateHs) {
  if (!networkHashrateExpected) return null;
  const share = hashrateHs / networkHashrateExpected;
  const btcPerDay = share * BLOCKS_PER_DAY * BLOCK_REWARD_BTC;
  return { btcPerDay, satsPerDay: btcPerDay * 1e8, share };
}

function thNeededFor1BtcPerDay() {
  if (!networkHashrateExpected) return null;
  const share = 1 / (BLOCKS_PER_DAY * BLOCK_REWARD_BTC);
  const hashrateNeededHs = share * networkHashrateExpected;
  return hashrateNeededHs / 1e12;
}

function wattsNeededFor1BtcPerDay(efficiencyJPerTh) {
  const thNeeded = thNeededFor1BtcPerDay();
  return thNeeded == null ? null : thNeeded * efficiencyJPerTh;
}

// PL -> PLN, wszystko inne (EN) -> USD.
function activeCurrency() {
  return currentLang === "pl" ? "pln" : "usd";
}

function formatMoney(amount, digits = 2) {
  const cur = activeCurrency();
  return cur === "pln" ? `${formatNumber(amount, digits)} zł` : `$${formatNumber(amount, digits)}`;
}

function valueInActiveCurrency(btcAmount) {
  if (!btcPrices) return null;
  return btcAmount * btcPrices[activeCurrency()];
}

function formatValue(btcAmount) {
  const v = valueInActiveCurrency(btcAmount);
  return v == null ? "–" : formatMoney(v);
}

let tableSort = { key: "watts", dir: 1 };
let lastRenderedWatts = 0;

const SORT_COLUMNS = [
  { key: "name", label: () => t("table_model") },
  { key: "units", label: () => t("table_units") },
  { key: "watts", label: () => t("table_watts") },
  { key: "hashrate", label: () => t("table_hashrate") },
  { key: "priceGrossSort", label: () => t("table_price_gross") },
  { key: "priceThSort", label: () => t("table_price_th") },
  { key: "satsDay", label: () => t("table_sats_day") },
  { key: "payback", label: () => t("table_payback") },
];

function buildMinerRows(maxWatts) {
  return MINERS.map(m => {
    const fits = maxWatts > 0 && m.watts <= maxWatts;
    const units = fits ? Math.floor(maxWatts / m.watts) : 0;
    // przy dopasowaniu liczymy dla tylu sztuk, ile zmieści się w mocy; inaczej dla jednej
    const hs = (fits ? units : 1) * m.hashrateThs * 1e12;
    const result = calcSatsPerDay(hs);
    const paybackD = paybackDays(m);
    return {
      miner: m,
      fits,
      units,
      name: m.name,
      watts: m.watts,
      hashrate: m.hashrateThs,
      priceGross: grossPrice(m),
      priceEstimated: !!m.estimated,
      buyUrl: m.buyUrl || null,
      priceTh: pricePerTh(m),
      priceGrossSort: grossPrice(m) == null ? Infinity : grossPrice(m),
      priceThSort: pricePerTh(m) == null ? Infinity : pricePerTh(m),
      satsDay: result ? result.satsPerDay : -1,
      satsDayLabel: result ? formatNumber(result.satsPerDay) : "–",
      payback: paybackD == null ? Infinity : paybackD,
      paybackLabel: formatPayback(paybackD),
    };
  });
}

// Cena linkuje do sklepu, w ktorym ta konkretna cena zostala zweryfikowana,
// zeby liczby w tabeli dalo sie sprawdzic zamiast brac na wiare.
function priceCell(r) {
  if (r.priceGross == null) return "?";
  const label = (r.priceEstimated ? "~" : "") + formatMoney(r.priceGross, 0);
  if (!r.buyUrl) return label;
  return `<a class="buy-link" href="${r.buyUrl}" target="_blank" rel="noopener noreferrer" title="${t("buy_link_title")}">${label}</a>`;
}

function renderMiners(maxWatts) {
  lastRenderedWatts = maxWatts;
  const container = document.getElementById("miners-table");
  const rows = buildMinerRows(maxWatts);

  rows.sort((a, b) => {
    const av = a[tableSort.key];
    const bv = b[tableSort.key];
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return cmp * tableSort.dir;
  });

  const headerCells = SORT_COLUMNS.map(col => {
    const active = tableSort.key === col.key;
    const arrow = active ? (tableSort.dir === 1 ? " ▲" : " ▼") : "";
    return `<th data-sort-key="${col.key}" class="${active ? "sorted" : ""}">${col.label()}${arrow}</th>`;
  }).join("");

  const bodyRows = rows.map(r => {
    return `<tr class="${r.fits ? "" : "no-fit"}">
      <td>${r.name}</td>
      <td>${r.fits ? `<span class="units">×${r.units}</span>` : "–"}</td>
      <td>${formatNumber(r.watts)} W</td>
      <td>${r.hashrate} TH/s</td>
      <td>${priceCell(r)}</td>
      <td>${r.priceTh == null ? "?" : "$" + r.priceTh.toFixed(0)}</td>
      <td>${r.satsDayLabel}</td>
      <td>${r.paybackLabel}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `<div class="table-scroll"><table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table></div>
  <p class="hint">${t("payback_disclaimer")}</p>
  <p class="hint">${maxWatts > 0 ? t("table_legend", formatNumber(maxWatts)) : t("miners_table_empty")}</p>`;
}

function updateOneBtcInfo(efficiency) {
  const oneBtcText = document.getElementById("one-btc-info");
  const oneBtcBox = document.getElementById("one-btc-box");
  if (!oneBtcText || !oneBtcBox) return;
  const wattsFor1Btc = efficiency > 0 ? wattsNeededFor1BtcPerDay(efficiency) : null;
  const thFor1Btc = thNeededFor1BtcPerDay();
  if (wattsFor1Btc && thFor1Btc) {
    oneBtcText.textContent = t("one_btc_info", efficiency, formatNumber(wattsFor1Btc), formatNumber(wattsFor1Btc / 1e6, 2), formatNumber(thFor1Btc / 1e6, 2));
    oneBtcBox.classList.remove("hidden");
  } else {
    oneBtcText.textContent = "";
    oneBtcBox.classList.add("hidden");
  }
}

function minerEfficiency(m) {
  return m.watts / m.hashrateThs;
}

function pricePerTh(m) {
  if (m.priceUsd == null) return null;
  return m.priceUsd / m.hashrateThs;
}

function grossPrice(m) {
  if (m.priceUsd == null) return null;
  if (activeCurrency() === "usd") return m.priceUsd;
  const usdToPln = btcPrices ? btcPrices.pln / btcPrices.usd : 4.0;
  return m.priceUsd * usdToPln;
}

// Zwraca liczbę dni do zwrotu inwestycji przy założeniu darmowego prądu.
// Niezależne od liczby sztuk — koszt i przychód skalują się tak samo.
function paybackDays(m) {
  if (!networkHashrateExpected || !btcPrices) return null;
  const result = calcSatsPerDay(m.hashrateThs * 1e12);
  if (!result) return null;
  const dailyValue = valueInActiveCurrency(result.btcPerDay);
  if (!dailyValue || dailyValue <= 0) return null;
  const gross = grossPrice(m);
  if (gross == null) return null;
  return gross / dailyValue;
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
    const perTh = pricePerTh(m) ?? Infinity;
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

function findMinEquipmentCombo(watts) {
  // Minimalna liczba sztuk sprzętu = pojedyncza koparka o największym poborze
  // mocy, która wciąż mieści się w budżecie. Przy remisie wygrywa większy hashrate.
  let best = null;
  for (const m of MINERS) {
    if (m.watts > watts) continue;
    if (
      !best ||
      m.watts > best.miner.watts ||
      (m.watts === best.miner.watts && m.hashrateThs > best.miner.hashrateThs)
    ) {
      best = { miner: m, units: Math.floor(watts / m.watts) };
    }
  }
  return best;
}

function updateMinEquipmentBox(watts) {
  const box = document.getElementById("min-equipment-box");
  const best = watts > 0 ? findMinEquipmentCombo(watts) : null;
  if (!best) {
    box.classList.add("hidden");
    return;
  }
  document.getElementById("min-equipment-text").textContent =
    t("min_equipment", best.units, best.miner.name);
  box.classList.remove("hidden");
  box.dataset.minerName = best.miner.name;
}

function findOptimalCombo(watts) {
  // Najlepsza opcja pod kątem zysku = najkrótszy zwrot z inwestycji (payback),
  // czyli najlepszy stosunek dziennej wartości do ceny zakupu.
  let best = null;
  for (const m of MINERS) {
    if (m.watts > watts) continue;
    const units = Math.floor(watts / m.watts);
    if (units < 1) continue;
    const payback = paybackDays(m);
    if (payback == null) continue;
    if (!best || payback < best.payback) {
      best = { miner: m, units, payback };
    }
  }
  return best;
}

function updateOptimalBox(watts) {
  const box = document.getElementById("optimal-box");
  const best = watts > 0 ? findOptimalCombo(watts) : null;
  if (!best) {
    box.classList.add("hidden");
    return;
  }
  document.getElementById("optimal-text").textContent =
    t("optimal", best.units, best.miner.name, formatPayback(best.payback));
  box.classList.remove("hidden");
  box.dataset.minerName = best.miner.name;
}

function populateMinerSelect(maxWatts) {
  const select = document.getElementById("miner");
  const hint = document.getElementById("miner-hint");
  const previous = select.value;

  const fitting = MINERS.filter(m => !maxWatts || m.watts <= maxWatts).sort((a, b) => a.watts - b.watts);

  const options = fitting.map(m =>
    `<option value="${m.name}">${formatNumber(m.watts)} W, ${m.hashrateThs} TH/s (${minerEfficiency(m).toFixed(1)} J/TH) — ${m.name} — ${grossPrice(m) == null ? "?" : (m.estimated ? "~" : "") + formatMoney(grossPrice(m), 0)}</option>`
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
  updateMinEquipmentBox(maxWatts);
  updateOptimalBox(maxWatts);
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
    const costRow = document.getElementById("r-cost-row");
    if (miner) {
      document.getElementById("r-payback").textContent = formatPayback(paybackDays(miner));
      paybackRow.classList.remove("hidden");
      const unitPrice = grossPrice(miner);
      const units = Math.floor(watts / miner.watts);
      const costLabel = unitPrice == null
        ? t("price_unknown")
        : units > 1
          ? t("cost_multi", formatMoney(unitPrice, 0), units, formatMoney(unitPrice * units, 0), !!miner.estimated)
          : t("cost_single", formatMoney(unitPrice, 0), !!miner.estimated);
      const rCost = document.getElementById("r-cost");
      if (unitPrice != null && miner.buyUrl) {
        rCost.innerHTML = `<a class="buy-link" href="${miner.buyUrl}" target="_blank" rel="noopener noreferrer" title="${t("buy_link_title")}">${costLabel}</a>`;
      } else {
        rCost.textContent = costLabel;
      }
      costRow.classList.remove("hidden");
    } else {
      paybackRow.classList.add("hidden");
      costRow.classList.add("hidden");
    }
    resultBox.classList.remove("hidden");
  }

  renderMiners(watts);
}

function onWattsChanged(watts) {
  populateMinerSelect(watts > 0 ? watts : 0);
  calculate();
}

function updateMinersDataDate() {
  const el = document.getElementById("miners-data-date");
  if (el) el.textContent = t("miners_data_date", MINERS_DATA_DATE);
}

function onLanguageChanged() {
  populateMinerSelect(parseFloat(document.getElementById("watts").value) || 0);
  calculate();
  updateMinersDataDate();
  if (networkHashrateHs) {
    document.getElementById("net-info").textContent = t("net_info", (networkHashrateHs / 1e18).toFixed(1), (networkDifficulty / 1e12).toFixed(2));
  }
  if (btcPrices) {
    document.getElementById("price-info").textContent = t("price_info", formatMoney(btcPrices[activeCurrency()], 0));
  }
}

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
document.getElementById("efficiency").addEventListener("input", calculate);
document.getElementById("best-value-use").addEventListener("click", () => {
  const name = document.getElementById("best-value-box").dataset.minerName;
  if (name) {
    document.getElementById("miner").value = name;
    toggleCustomEfficiency();
    calculate();
  }
});
document.getElementById("min-equipment-use").addEventListener("click", () => {
  const name = document.getElementById("min-equipment-box").dataset.minerName;
  if (name) {
    document.getElementById("miner").value = name;
    toggleCustomEfficiency();
    calculate();
  }
});
document.getElementById("optimal-use").addEventListener("click", () => {
  const name = document.getElementById("optimal-box").dataset.minerName;
  if (name) {
    document.getElementById("miner").value = name;
    toggleCustomEfficiency();
    calculate();
  }
});

document.getElementById("miners-table").addEventListener("click", e => {
  const th = e.target.closest("th[data-sort-key]");
  if (!th) return;
  const key = th.dataset.sortKey;
  if (tableSort.key === key) {
    tableSort.dir *= -1;
  } else {
    tableSort = { key, dir: 1 };
  }
  renderMiners(lastRenderedWatts);
});

populateMinerSelect(0);
fetchNetworkHashrate();
fetchBtcPrice();
renderMiners(0);
updateMinersDataDate();
