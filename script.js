spellData = transformToArrayOld(loadFileString("spells.csv"));
filteredTier = '';
//initial table
drawTableOld(spellData);
//adding filters
let sel = document.getElementById("tier-select");
let opt = document.createElement('option');
opt.value = ""
opt.text = "AnyTier";
sel.appendChild(opt);
opt = document.createElement('option');
opt.value = "1"
opt.text = "1";
sel.appendChild(opt);
opt = document.createElement('option');
opt.value = "dick"
opt.text = "dick";
opt.disabled = true;
sel.appendChild(opt);
// adding events for the filter
sel.onchange = () => { filterDataOld(sel.value); };

//adding test sort button
let but = document.createElement('button');
but.textContent = 'text';
but.onclick = () => { sortDataOld(0); }
document.body.appendChild(but);