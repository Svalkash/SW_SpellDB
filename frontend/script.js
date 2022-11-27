spellData = parseStringSpells(loadFileString("spells_part.csv"));
filteredTier = '';
//initial table
drawTable(spellData);
//adding filters
prepareTierSelect();