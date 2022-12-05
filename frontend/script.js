//===================================================
//===================================================

// globals
var spellData; // spell data array
var filteredTier; // filtered tier... ID?
var sortedCol; // sort by this column
var sortedAsc = true; // boolean
const colNames = ['Уровень', 'Имя', 'Пункты силы', 'Дистанция', 'Длительность']; //column names
const colProps = ['tier', 'name', 'pp', 'dist', 'dur']; //names for addressing
var stats = {}; // entered stats

//===================================================
// functions

function loadFileString(filename) {
    let xhReq = new XMLHttpRequest();
    xhReq.open("GET", filename, false);
    xhReq.send();
    if (xhReq.status != 200) {
        alert("File opening error!");
        return undefined;
    }
    return xhReq.responseText;
}

function spellValid(spellObj) {
    return tierValid(spellObj.tier)
        && spellObj.name != ''
        && ppValid(spellObj.pp)
        && spellObj.dist != null
        && spellObj.dur != null;
}

function parseStringSpells(str) {
    let spellStringArray = str.split('\r\n');
    let retArray = [];
    // for each spell
    for (let i = 0; i < spellStringArray.length; ++i) {
        let spellParts = spellStringArray[i].split(csvSeparator);
        let spellObj = {
            tier: firstCapital(spellParts[0].trim()),
            name: spellParts[1].trim(),
            pp: spellParts[2].trim().toLowerCase(),
            dist: distStrToObj(spellParts[3]),
            dur: durStrToObj(spellParts[4]),
            trap: spellParts[5].trim(),
            desc: ''
        };
        for (let j = 6; j < spellParts.length; ++j)
            spellObj.desc += spellParts[j].trim() + '\r\n'; // paragraphs
        spellObj.desc = spellObj.desc.slice(0, -2); // trim last \r\n
        // validate
        let isValid = true;
        if (!spellValid(spellObj)) {
            alert("Spell loading error!");
            console.log("Spell loading error:", spellParts, spellObj);
            isValid = false;
        } else {
            for (let dupSpell of retArray)
                if (spellObj.name == dupSpell.name) {
                    alert("Duplicate spell name!");
                    console.log("Duplicate spell name:", dupSpell, spellObj);
                    isValid = false;
                    break;
                }
        }
        if (isValid) retArray.push(spellObj);
    }
    return retArray;
}

function addCellToRow(row, innerHTML, onclick = null) {
    let cell = row.insertCell();
    cell.innerHTML = innerHTML;
    cell.classList.add('tabclass');
    if (onclick != null)
        cell.onclick = onclick;
    return cell;
}

function addSortButtonOld(row, col) {
    let but = document.createElement('button');
    but.textContent = sortedCol == col ? (sortedAsc ? '↓' : '↑') : '⇅';
    but.onclick = () => { sortDataOld(col); }
    row.cells[row.cells.length - 1].appendChild(but);
}

function addSortButton(row, col) {
    let but = document.createElement('button');
    but.textContent = sortedCol == col ? (sortedAsc ? '↑' : '↓') : '⇅';
    but.onclick = () => { sortData(col); }
    row.cells[row.cells.length - 1].appendChild(but);
}

function drawTableOld() {
    console.log('redrawing...');
    // console.log(spellData);
    // console.log(filteredTier);
    let tab = document.getElementById("spelltab");
    tab.innerHTML = "";
    tab.classList.add('tabclass');
    // adding headers
    let thead = tab.createTHead();
    let tb = tab.createTBody();
    let row = thead.insertRow();
    for (let i = 0; i < colNames.length; ++i) {
        addCellToRow(row, colNames[i] + '&nbsp');
        addSortButtonOld(row, i);
    }
    // adding contents
    for (let spellArr of spellData) {
        if (filteredTier == '' || spellArr[1] == filteredTier) {
            row = tb.insertRow();
            for (let elem of spellArr)
                addCellToRow(row, elem);
        }
    }
}

function drawTable() {
    console.log('redrawing...');
    // console.log(spellData);
    // console.log(filteredTier);
    let tab = document.getElementById("spelltab");
    tab.innerHTML = "";
    tab.classList.add('tabclass');
    // adding headers
    let thead = tab.createTHead();
    let tb = tab.createTBody();
    let row = thead.insertRow();
    for (let i = 0; i < colNames.length; ++i) {
        addCellToRow(row, colNames[i] + '&nbsp');
        addSortButton(row, i);
    }
    // adding contents
    for (let spellObj of spellData) {
        if (filteredTier == '' || tierToNum(spellObj.tier) == filteredTier) {
            row = tb.insertRow();
            addCellToRow(row, spellObj.tier).href;
            addCellToRow(row, spellObj.name);
            addCellToRow(row, spellObj.pp);
            addCellToRow(row, distObjToVal(spellObj.dist));
            addCellToRow(row, durObjToVal(spellObj.dur));
        }
    }
}

function transformToArrayOld(str) {
    let ret = str.split('\r\n');
    for (let i = 0; i < ret.length; ++i) {
        ret[i] = ret[i].split(csvSeparator);
        for (let j = 0; j < ret[i].length; ++j)
            ret[i][j] = ret[i][j].trim(); // failsafe from spaces
    }
    return ret;
}

function defaultCompare(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
}

function sortDataOld(colNum) {
    sortedAsc = sortedCol != colNum || !sortedAsc;
    sortedCol = colNum; // for descendant
    spellData.sort((row1, row2) => {
        if (sortedAsc) return defaultCompare(row1[sortedCol], row2[sortedCol]);
        else return defaultCompare(row2[sortedCol], row1[sortedCol]); //kinda reverse
    });
    drawTableOld();
}

function smarterCompare(a, b, reverse) {
    if (reverse) return defaultCompare(a, b);
    else return defaultCompare(b, a); //kinda reverse
}

function sortData(colNum) {
    let toNumFunction = [tierToNum, (x) => x, ppToNum, distObjToNum, durObjToNum][colNum];
    sortedAsc = sortedCol != colNum || !sortedAsc;
    sortedCol = colNum; // for descendant
    let propName = colProps[colNum];
    spellData.sort((row1, row2) => {
        return smarterCompare(toNumFunction(row1[propName]), toNumFunction(row2[propName]), !sortedAsc);
    });
    drawTable();
}

function filterDataOld(tier) {
    filteredTier = tier;
    drawTableOld();
}

function filterData(tier) {
    console.log(tier);
    filteredTier = tier;
    drawTable();
}

function addSelectOption(elem, optVal, optText = null) {
    let opt = document.createElement('option');
    opt.value = optVal;
    opt.text = optText === null ? optVal : optText;
    elem.appendChild(opt);
}

function prepareTierSelect() {
    let sel = document.getElementById("tier-select");
    addSelectOption(sel, "", "---");
    for (let tier in TIERS)
        addSelectOption(sel, TIERS[tier], tier);
    sel.onchange = () => { filterData(sel.value); };
}

//======================================================================================================
//======================================================================================================
//======================================================================================================

spellData = parseStringSpells(loadFileString("spells_part.csv"));
filteredTier = '';
//initial table
drawTable(spellData);
//adding filters
prepareTierSelect();