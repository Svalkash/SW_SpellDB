// globals
var spellData; // spell data array
var filteredTier; // filtered tier... ID?
var sortedCol; // sort by this column
var sortedAsc; // boolean
var theadNames = ['Names', 'Tiers', 'Effects'];

//===================================================
// functions

function addCellToRow(row, innerHTML, onclick = null) {
    let cell = row.insertCell();
    cell.innerHTML = innerHTML;
    cell.classList.add('tabclass');
    if (onclick != null)
        cell.onclick = onclick;
}

function addSortButton(row, col) {
    let but = document.createElement('button');
    but.textContent = sortedCol == col ? (sortedAsc ? '↓' : '↑') : '⇅';
    but.onclick = () => { sortData(col); }
    row.cells[row.cells.length - 1].appendChild(but);
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
    for (let i = 0; i < theadNames.length; ++i) {
        addCellToRow(row, theadNames[i] + '&nbsp');
        addSortButton(row, i);
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

function transformToArray(str) {
    let ret = str.split('\r\n');
    for (let i = 0; i < ret.length; ++i) {
        ret[i] = ret[i].split(',');
        for (let j = 0; j < ret[i].length; ++j)
            ret[i][j] = ret[i][j].trim(); // failsafe from spaces
    }
    return ret;
}

function defaultCompare(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
}

function sortData(colNum) {
    sortedAsc = sortedCol != colNum || !sortedAsc;
    sortedCol = colNum; // for descendant
    spellData.sort((row1, row2) => {
        if (sortedAsc) return defaultCompare(row1[sortedCol], row2[sortedCol]);
        else return defaultCompare(row2[sortedCol], row1[sortedCol]); //kinda reverse
    });
    drawTable();
}

function filterData(tier) {
    filteredTier = tier;
    drawTable();
}