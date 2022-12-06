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

function loadServerData() {
    let request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        try {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    respArr = JSON.parse(request.responseText);
                    spellData = respArr.map(spellObjFromResponse);
                    drawTable(spellData);
                }
                else alert("Request error: " + request.status);
            }
        } catch (e) {
            alert(`Caught Exception: ${e.description}`);
        }
    }
    request.open("GET", "http://localhost:5000/api/spelldb");
    request.send();
}

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
            desc: []
        };
        for (let j = 6; j < spellParts.length; ++j)
            spellObj.desc.push(spellParts[j].trim()); // paragraphs
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

function addCellToRow(row, contents) {
    let cell = row.insertCell();
    if (typeof (contents) == 'string')
        cell.innerHTML = contents;
    else cell.appendChild(contents);
    cell.classList.add('tabclass');
    return cell;
}

function addSortButton(row, col) {
    let but = document.createElement('button');
    but.textContent = sortedCol == col ? (sortedAsc ? '↑' : '↓') : '⇅';
    but.onclick = () => { sortData(col); }
    row.cells[row.cells.length - 1].appendChild(but);
}

function drawTable() {
    console.log('redrawing...');
    // console.log(spellData);
    // console.log(filteredTier);
    let tab = document.getElementById("spelltab");
    let list = document.getElementById("spelllist");
    tab.innerHTML = "";
    list.innerHTML = "";
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
            let spellID_tab = 'spell_' + spellObj.name + '_row';
            let spellID_list = 'spell_' + spellObj.name + '_desc';
            // add to the table
            row = tb.insertRow();
            row.id = spellID_tab;
            addCellToRow(row, spellObj.tier);
            let hr = document.createElement('a');
            hr.href = '#' + spellID_list;
            hr.innerHTML = spellObj.name;
            addCellToRow(row, hr);
            addCellToRow(row, spellObj.pp);
            addCellToRow(row, distObjToVal(spellObj.dist));
            addCellToRow(row, durObjToVal(spellObj.dur));
            // add to the list
            let desc = document.createElement('div');
            desc.id = spellID_list;
            // name-header
            let h = document.createElement('h3');
            h.innerHTML = spellObj.name;
            desc.appendChild(h);
            // info list
            let p = document.createElement('p');
            p.append(colNames[0] + ': ' + spellObj.tier);
            p.appendChild(document.createElement('br'));
            p.append(colNames[2] + ': ' + spellObj.pp);
            p.appendChild(document.createElement('br'));
            p.append(colNames[3] + ': ' + distObjToVal(spellObj.dist));
            p.appendChild(document.createElement('br'));
            p.append('Проявления: ' + spellObj.trap);
            desc.appendChild(p);
            // desc
            for (let dp of spellObj.desc) {
                p = document.createElement('p');
                p.innerHTML = dp;
                desc.appendChild(p);
            }
            list.appendChild(desc);
            // back-anchor
            hr = document.createElement('a');
            hr.href = '#' + spellID_tab;
            hr.innerHTML = 'К таблице';
            desc.appendChild(hr);
        }
    }
}

function defaultCompare(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
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
// old method
// spellData = parseStringSpells(loadFileString("spells_part.csv"));
//adding filters
filteredTier = '';
prepareTierSelect();

loadServerData();

// document.getElementById("send3").onclick = () => {
//     for (let spell of spellData) {
//         let fd = spellObjToFormData(spell)
//         let request = new XMLHttpRequest();
//         request.onreadystatechange = () => {
//             try {
//                 if (request.readyState === XMLHttpRequest.DONE) {
//                     if (request.status === 200) console.log("Success!")
//                     else console.log("Request error: " + request.status);
//                 }
//             } catch (e) {
//                 alert(`Caught Exception: ${e.description}`);
//             }
//         }
//         request.open("POST", "http://localhost:5000/api/spelldb");
//         request.send(fd);
//     }
// }