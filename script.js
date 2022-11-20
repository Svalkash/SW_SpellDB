function addCellToRow(row, innerHTML) {
    let cell = row.insertCell();
    cell.innerHTML = innerHTML;
    cell.classList.add('tabclass');
}

//Level, Range, PP, Distance, Duration, Display, Description
let myCoolSpells = [
    ['name1', 1, 'effect1'],
    ['name2', 1, 'effect2'],
    ['name3', 2, 'effect3'],
];

function drawTable(filteredTier = "") {
    let tab = document.getElementById("spelltab");
    tab.innerHTML = "";
    tab.classList.add('tabclass');
    document.body.appendChild(tab);
    // adding headers
    let thead = tab.createTHead();
    let tb = tab.createTBody();
    let row = thead.insertRow();
    addCellToRow(row, 'Names');
    addCellToRow(row, 'Tiers');
    addCellToRow(row, 'Effects');
    // adding contents
    for (spellArr of myCoolSpells) {
        if (filteredTier == "" || spellArr[1] == filteredTier) {
            row = tb.insertRow();
            for (elem of spellArr)
                addCellToRow(row, elem);
        }
    }
}

drawTable();
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
sel.onchange = () => { drawTable(sel.value); };
