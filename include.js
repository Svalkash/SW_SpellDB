// consts
const csvSeparator = ';'; //symbol to separate stuff in CSV with spells
const STAT_NAMES = ['сила', 'ловкость', 'смекалка', 'характер'];
const STAT_NAMES_SHORT = ['сил', 'лов', 'сме', 'хар'];
const SPECIAL_WORDS = ['special', 'специальное', 'особая'];

//===================================================
// 'types'
const TIERS = {
    'Новичок': 1,
    'Закаленный': 2,
    'Ветеран': 3
};

// purely beautification
function firstCapital(str) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function tierValid(tier) {
    return tierToNum(tier) !== null; // strict to avoid 0
}
function tierToNum(tier) {
    if (TIERS.hasOwnProperty(tier)) return TIERS[tier];
    else return null;
}
function tierFromNum(tierNum) {
    for (let tier in TIERS)
        if (tierNum == TIERS[tier])
            return tier;
    return null;
}
//===================================================
function ppToNum(pp) {
    pp = pp.trim().toLowerCase();
    return SPECIAL_WORDS.indexOf(pp) != -1 ? -1 : pp == '' ? 0 :// special cases
        isNaN(parseInt(pp)) ? null : parseInt(pp); // +a is conversion to Number
}
function ppValid(pp) {
    return ppToNum(pp) !== null;
}
//===================================================
function buildDistRegex() {
    let r = '^((';
    // all stats
    for (let stat of STAT_NAMES.concat(STAT_NAMES_SHORT))
        r += stat + '|';
    r = r.slice(0, -1) + ') *([*xXхХ])? *)?';
    r += ' *(([0-9]+/)*[0-9]+)? *(см|м|км|)?$';
    r = new RegExp(r, 'i');
    return r;
}
/*
Matches:
2 - stat
3 - '*' if present
4 - value
5 - 'something', if a/b/c-type value
6 - unit
*/

function distUnique(distStr) {
    return SPECIAL_WORDS.indexOf(distStr) != -1
        || toString(distStr).match('шаблон') !== null
        || distStr == 'касание'
        || distStr == 'на себя'
        || distStr == 'поле зрения';
}

function distStrToObj(distStr) {
    distStr = distStr.trim().toLowerCase();
    // unique cases
    if (distUnique(distStr)) return {
        stat: null,
        val: distStr,
        unit: null
    }    
    // others
    let matchRes = distStr.match(buildDistRegex());
    if (matchRes === null)
        return null;
    else if (matchRes[2] && matchRes[4] && !matchRes[3] // stat, val and no '*'
        || matchRes[2] && matchRes[3] && !matchRes[4] // stat, '*', but no value
        || matchRes[5] && matchRes[2]) // a/b/c and stat, illegal currently
        return null;
    else return {
        stat: matchRes[2] === undefined ? null : matchRes[2],
        val: matchRes[4] === undefined ? 1 : matchRes[4],
        unit: matchRes[6] === undefined ? null : matchRes[6]
    }
}

function distStrValid(distStr) {
    return distStrToObj(distStr) != null;
}

// value for sorting. something negative if the stat is not present
function distObjToNum(distObj) {
    // uniques
    if (SPECIAL_WORDS.indexOf(distObj.val) != -1) return -2000000;
    if (toString(distObj.val).match('шаблон') !== null) return 0.1;
    if (distObj.val == 'касание') return 0;
    if (distObj.val == 'на себя') return -0.1;
    if (distObj.val == 'поле зрения') return 1000000;
    // normals
    let multiValRE = new RegExp('([0-9]+)(/[0-9]+)+'); // for filtering 12/14/17
    let multiValMatch = toString(distObj.val).match(multiValRE);
    let minVal = multiValMatch === null ? distObj.val : multiValMatch[1]; // '12' or value
    let unitCoef = distObj.unit == 'см' ? 0.01
        : distObj.unit == 'м' ? 1.0
            : distObj.unit == 'км' ? 1000.0
                : 1.5; // клетка = 1.5м
    let preStat = minVal * unitCoef; // without the stat
    if (distObj.stat === null) return preStat; // no stat, no problem
    else if (stats.hasOwnProperty(distObj.stat)) return stats[distObj.stat]/2 * preStat;
    else return -1000000 + preStat; // at the bottom, but still somehow sorted
}

// displayed value. With stat if possible.
function distObjToVal(distObj) {
    if (distUnique(distObj.val))
        return distObj.val;
        let retVal = '';
    if (distObj.stat !== null && stats.hasOwnProperty(distObj.stat) && !isNaN(distObj.val)) {
        retVal += (stats[distObj.stat] / 2 * distObj.val);
    } else {
        if (distObj.stat != null) retVal += distObj.stat;
        if (distObj.stat != null && distObj.val != null && distObj.val != 1) retVal += ' * ';
        if (distObj.val != null && distObj.val != 1) retVal += distObj.val;
    }
    if (distObj.unit != null) retVal += ' ' + distObj.unit;
    return retVal;
}
//===================================================

function durUnique(durStr) {
    return SPECIAL_WORDS.indexOf(durStr) != -1
        || durStr == 'мгновенно'
        || durStr == 'концентрация';
}

//WIP

function durStrToObj(durStr) {
    durStr = durStr.trim().toLowerCase();
    // unique cases
    if (durUnique(durStr)) return {
        val: durStr,
        unit: null,
        prolong: null
    }    
    // others
    let durRegex = new RegExp('^([0-9]+) *(|мин|час)\\.? *(\\([^)]*\\))?');
    let matchRes = durStr.match(durRegex);
    if (matchRes === null)
        return null;
    else return {
        val: matchRes[1],
        unit: matchRes[2] === undefined ? null : matchRes[2],
        prolong: matchRes[3] === undefined ? null : matchRes[3]
    }
}

function durStrValid(durStr) {
    return durStrToObj(durStr) != null;
}

// value for sorting. something negative if the stat is not present
function durObjToNum(durObj) {
    // uniques
    if (SPECIAL_WORDS.indexOf(durObj.val) != -1) return -2000000;
    if (durObj.val == 'мгновенно') return 0;
    if (durObj.val == 'концентрация') return 0.1;
    // normals
    let unitCoef = durObj.unit == 'час' ? 600
        : durObj.unit == 'мин' ? 10
            : 1;
    return durObj.val * unitCoef;
}

// displayed value. Same as input?
function durObjToVal(durObj) {
    if (durUnique(durObj.val))
        return durObj.val;
    let retVal = '';
    if (durObj.val != null) retVal += durObj.val;
    if (durObj.unit != null) retVal += ' ' + durObj.unit;
    if (durObj.prolong != null) retVal += ' ' + durObj.prolong;
    return retVal;
}

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
        if (!spellValid(spellObj)) {
            alert("Spell loading error!");
            console.log("Spell loading error:", spellParts, spellObj);
        } else retArray.push(spellObj);
    }
    return retArray;
}

function addCellToRow(row, innerHTML, onclick = null) {
    let cell = row.insertCell();
    cell.innerHTML = innerHTML;
    cell.classList.add('tabclass');
    if (onclick != null)
        cell.onclick = onclick;
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
            addCellToRow(row, spellObj.tier);
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
    filteredTier = tier;
    drawTable();
}