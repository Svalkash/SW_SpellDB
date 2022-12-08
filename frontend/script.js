//===================================================
//===================================================

// globals
var spellData; // spell data array
var filteredTier; // filtered tier... ID?
var sortedCol = 0; // sort by this column
var sortedAsc = true; // boolean
const colNames = ['Уровень', 'Имя', 'Пункты силы', 'Дистанция', 'Длительность']; //column names
const colProps = ['tier', 'name', 'pp', 'dist', 'dur']; //names for addressing

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
                    drawTable();
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
    but.onclick = () => {
        drawTable(col);
    }
    row.cells[row.cells.length - 1].appendChild(but);
}

function drawTable(sortByColNum=null) {
    console.log('redrawing...');
    // first, re-sort with everything included
    sortData(sortByColNum);
    // now, draw the table
    let tab = document.getElementById("spell-tab");
    let list = document.getElementById("spell-list");
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

function sortData(colNum=null) {
    // if colNum == null, re-sort for stat or something else, no buttons pressed
    if (colNum !== null) {
        sortedAsc = sortedCol != colNum || !sortedAsc;
        sortedCol = colNum; // for descendant
    }
    let propName = colProps[sortedCol];
    let toNumFunction = [tierToNum, (x) => x, ppToNum, distObjToNum, durObjToNum][sortedCol];
    spellData.sort((row1, row2) => {
        return smarterCompare(toNumFunction(row1[propName]), toNumFunction(row2[propName]), !sortedAsc);
    });
}

function filterData(tier) {
    console.log(tier);
    filteredTier = tier;
    drawTable();
}

//======================================================================================================
// stuff for loading

function addSelectOption(elem, optVal, optText = null) {
    let opt = document.createElement('option');
    opt.value = optVal;
    opt.text = optText === null ? optVal : optText;
    elem.appendChild(opt);
}

function prepareTierFilter() {
    let sel = document.getElementById("tier-filter");
    addSelectOption(sel, "", "---");
    for (let tier in TIERS)
        addSelectOption(sel, TIERS[tier], tier);
    sel.onchange = () => { filterData(sel.value); };
}

function prepareDialogForm() {
    // prepare tier options
    let tierSel = document.getElementById("new-tier");
    for (let tier in TIERS)
        addSelectOption(tierSel, TIERS[tier], tier);
    // prepare checkers
    document.getElementById("new-name").oninput = () => {
        if (nameValid(document.getElementById("new-name").value, spellData))
            document.getElementById("new-name-mark").innerHTML = "OKAY";
        else
            document.getElementById("new-name-mark").innerHTML = "ERROR";
    }
    document.getElementById("new-pp").oninput = () => {
        if (ppValid(document.getElementById("new-pp").value))
            document.getElementById("new-pp-mark").innerHTML = "OKAY";
        else
            document.getElementById("new-pp-mark").innerHTML = "ERROR";
    }
    document.getElementById("new-dist").oninput = () => {
        if (distStrValid(document.getElementById("new-dist").value))
            document.getElementById("new-dist-mark").innerHTML = "OKAY";
        else
            document.getElementById("new-dist-mark").innerHTML = "ERROR";
    }
    document.getElementById("new-dur").oninput = () => {
        if (durStrValid(document.getElementById("new-dur").value))
            document.getElementById("new-dur-mark").innerHTML = "OKAY";
        else
            document.getElementById("new-dur-mark").innerHTML = "ERROR";
    }
    document.getElementById("new-spell-form").oninput = () => {
        if (nameValid(document.getElementById("new-name").value, spellData)
            && ppValid(document.getElementById("new-pp").value)
            && distStrValid(document.getElementById("new-dist").value)
            && durStrValid(document.getElementById("new-dur").value))
            document.getElementById("new-send").disabled = false;
        else
            document.getElementById("new-send").disabled = true;
    };
    // prepare form actions
    document.getElementById("new-spell-form").onsubmit = () => {
        // first, add the spell to the table
        let spellObj = {
            tier: tierFromNum(document.getElementById("new-tier").value),
            name: document.getElementById("new-name").value.trim(),
            pp: document.getElementById("new-pp").value.trim().toLowerCase(),
            dist: distStrToObj(document.getElementById("new-dist").value),
            dur: durStrToObj(document.getElementById("new-dur").value),
            trap: document.getElementById("new-trap").value.trim(),
            desc: document.getElementById("new-desc").value
                .split('\n')
                .filter(x => Boolean(x.trim()))
                .map(x => x.trim())
        };
        if (!spellValid(spellObj)) {
            alert("Spell invalid!");
            return;
        }
        spellData.push(spellObj);
        // update the table
        drawTable();
        // then, make a formdata and send it
        let request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            try {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) console.log("Spell sent successfully!");
                    else alert("Request error: " + request.status);
                }
            } catch (e) {
                alert(`Caught Exception: ${e.description}`);
            }
        }
        request.open("POST", "http://localhost:5000/api/spelldb");
        request.send(spellObjToFormData(spellObj));
        // reset the form
        document.getElementById("new-spell-form").reset();
    }
    document.getElementById("new-cancel").onclick = () => {
        document.getElementById("new-spell-dialog").close();
    }
    // prepare dialog opener
    document.getElementById("open-dialog").onclick = () => {
        document.getElementById("new-spell-dialog").showModal();
    }
}

function prepareStatForm() {
    document.getElementById("stat-form").oninput = () => {
        drawTable();
    }
}

//======================================================================================================
//======================================================================================================
//======================================================================================================
// old method
// spellData = parseStringSpells(loadFileString("spells_part.csv"));
// prepare content
filteredTier = '';
prepareTierFilter();
prepareDialogForm();
prepareStatForm();
// load data
loadServerData();