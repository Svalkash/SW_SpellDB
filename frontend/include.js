// consts
const csvSeparator = ';'; //symbol to separate stuff in CSV with spells
const STAT_NAMES = ['сила', 'ловкость', 'смекалка', 'характер', 'выносливость'];
const STAT_NAMES_SHORT = ['сил', 'лов', 'сме', 'хар', 'вын'];
const STAT_IDS = ["stat-str", "stat-agi", "stat-sma", "stat-spi", "stat-vig"];
const SPECIAL_WORDS = ['special', 'специальное', 'особое', 'особая'];

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
// checks for empty values and for duplicates
function nameValid(name, spellArray = null) {
    let fixedName = name.trim().toLowerCase();
    if (fixedName == "") return false;
    if (spellArray != null) {
        for (let spell of spellArray)
            if (fixedName == spell.name.toLowerCase())
                return false;
    }
    return true;
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
        stat: '',
        val: distStr,
        unit: ''
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
        stat: matchRes[2] === undefined ? '' : matchRes[2],
        val: matchRes[4] === undefined ? 1 : matchRes[4],
        unit: matchRes[6] === undefined ? '' : matchRes[6]
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
    if (distObj.stat === '') return preStat; // no stat, no problem
    else if (getStatValue(distObj.stat) !== null) return getStatValue(distObj.stat) / 2 * preStat;
    else return -1000000 + preStat; // at the bottom, but still somehow sorted
}

function getStatValue(statName) {
    for (let i = 0; i < STAT_IDS.length; ++i)
        if (statName == STAT_NAMES[i] || statName == STAT_NAMES_SHORT[i])
            return document.getElementById(STAT_IDS[i]).value == '' ? null
                : document.getElementById(STAT_IDS[i]).value;
    return undefined;
}

// displayed value. With stat if possible.
// calcStat - set to false to prevent stat usage
function distObjToVal(distObj, calcStat = true) {
    if (distUnique(distObj.val))
        return distObj.val;
    let retVal = '';
    if (distObj.stat != '' && getStatValue(distObj.stat) !== null && !isNaN(distObj.val) && calcStat) {
        retVal += (getStatValue(distObj.stat) / 2 * distObj.val);
    } else {
        if (distObj.stat != '') retVal += distObj.stat;
        if (distObj.stat != '' && distObj.val != '' && distObj.val != 1) retVal += ' * ';
        if (distObj.val != '' && distObj.val != 1) retVal += distObj.val;
    }
    if (distObj.unit != '') retVal += ' ' + distObj.unit;
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
        unit: '',
        prolong: ''
    }
    // others
    let durRegex = new RegExp('^([0-9]+) *(|мин|час)\\.? *(\\([^)]*\\))?');
    let matchRes = durStr.match(durRegex);
    if (matchRes === null)
        return null;
    else return {
        val: matchRes[1],
        unit: matchRes[2] === undefined ? '' : matchRes[2],
        prolong: matchRes[3] === undefined ? '' : matchRes[3]
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
    if (durObj.val != '') retVal += durObj.val;
    if (durObj.unit != '') retVal += ' ' + durObj.unit;
    if (durObj.prolong != '') retVal += ' ' + durObj.prolong;
    return retVal;
}

function spellObjToFormData(spellObj) {
    let fd = new FormData();
    fd.append('tier', spellObj.tier);
    fd.append('name', spellObj.name);
    fd.append('pp', spellObj.pp);
    fd.append('dist_stat', spellObj.dist.stat);
    fd.append('dist_val', spellObj.dist.val);
    fd.append('dist_unit', spellObj.dist.unit);
    fd.append('dur_val', spellObj.dur.val);
    fd.append('dur_unit', spellObj.dur.unit);
    fd.append('dur_prolong', spellObj.dur.prolong);
    fd.append('trap', spellObj.trap);
    for (let i = 0; i < spellObj.desc.length; ++i)
        fd.append('desc_' + i, spellObj.desc[i]);
    return fd;
}

function spellObjFromResponse(respObj) {
    let spellObj = {
        tier: respObj.tier,
        name: respObj.name,
        pp: respObj.pp,
        dist: {
            stat: respObj.dist_stat,
            val: respObj.dist_val,
            unit: respObj.dist_unit
        },
        dur: {
            val: respObj.dur_val,
            unit: respObj.dur_unit,
            prolong: respObj.dur_prolong
        },
        trap: respObj.trap,
        desc: []
    };
    let i = 0;
    while (respObj.hasOwnProperty('desc_' + i)) {
        spellObj.desc.push(respObj['desc_' + i]);
        ++i;
    }
    return spellObj;
}