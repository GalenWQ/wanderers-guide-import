const abilityScores = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
var applyChanges = !1;
const pbcolor1 = "color: #7bf542",
    pbcolor2 = "color: #d8eb34",
    pbcolor3 = "color: #ffffff",
    pbcolor4 = "color: #cccccc",
    pbcolor5 = "color: #ff0000";

//TODO: spellcasting
//TODO: custom proficiencies/bonus feats
//TODO: lores
//TODO: containers
//TODO: update existing characters
//TODO: animal companions/familiars?
//TODO: README
//TODO: refactor and minify

Hooks.on("renderActorSheet", async function (obj, html) {
        const actor = obj.actor;
        if ("character" === actor.data.type && 0 != actor.canUserModify(game.user, "update")) {
            let element = html.find(".window-header .window-title");
            if (1 == element.length) {
                let button = $('<a class="popout" style><i class="fas fa-book"></i>Import from Wanderer\'s Guide</a>');
                button.on("click", () => beginImport(obj.object)), element.after(button);
            }
        }
    });

async function beginImport(targetActor) {
  console.log("Opening import window.");
  new Dialog({
        title: "Wanderer's Guide Import",
        content: `
      <div>
        <h3>Export your character from Wanderer's Guide:</h3>
        <p>1) go to your <a href="https://wanderersguide.app/profile/characters">Wanderer's Guide character list</a></p>
        <p>2) click "Options" under the character you want to export</p> 
        <p>3) select "Export". This will download a file called (your character's name).guidechar
      <div>
      <hr/>
      <h3>To import (this will overwrite your current character sheet):
      <form>
        <label for="guidechar">Select your .guidechar file:</label>
        <input type="file" id="guidechar" name="guidechar" accept=".guidechar">
        <br>
        <p>OR</p>
        <label for="guidechar-text">Open in a text editor and paste the full text of your .guidechar file here:</label>
        <textarea id="guidechar-text"></textarea>
      </form>
      <br><br>
      `,
        buttons: { yes: { icon: "<i class='fas fa-check'></i>", label: "Import", callback: () => (applyChanges = !0) }, no: { icon: "<i class='fas fa-times'></i>", label: "Cancel" } },
        default: "yes",
        close: (html) => {
            applyChanges &&
                (validateInput(targetActor, html.find('[id="guidechar"]')[0].files[0], html.find('[id="guidechar-text"]')[0].value))
        },
    }).render(!0);
}

function validateInput(targetActor, guidechar, guidechar_text) {
  applyChanges = !1;
  console.log(guidechar_text);
  if (guidechar_text && guidechar_text != "") {
    var str = guidechar_text;
    console.log("File contents: " + str);
    var jsonBuild;
    try {
      jsonBuild = JSON.parse(str);
      console.log(jsonBuild.character.name)
    } catch (e) {
      ui.notifications.warn("guidechar file invalid");
      return;
    }
    importCharacter(targetActor, jsonBuild);
  } else {
    let reader = new FileReader();

    reader.onload = function(event) {
      var str = event.target.result;
      console.log("File contents: " + str);
      var jsonBuild;
      try {
        jsonBuild = JSON.parse(str);
        console.log(jsonBuild.character.name)
      } catch (e) {
        ui.notifications.warn("guidechar file invalid");
        return;
      }
      importCharacter(targetActor, jsonBuild);
    };

    reader.onerror = function(event) {
        console.error("File could not be read! Code " + event.target.error.code);
    };

    reader.readAsText(guidechar);
  }
}

async function importCharacter(targetActor, jsonBuild) {
  console.log("%cWanderer's Guide Import | %cDeleting all items", pbcolor1, pbcolor4);
  await targetActor.deleteEmbeddedDocuments("Item", ["123"], { deleteAll: !0 });
  console.log(targetActor);
  targetActor.update({
    name: jsonBuild.character.name,
    "token.name": jsonBuild.character.name,
    "data.details.level.value": jsonBuild.character.level,
    "data.details.heritage.value": jsonBuild.character._heritage.name,
    "data.details.keyability.value": parseKeyAbility(jsonBuild),
    "data.traits.size.value": getSizeValue(jsonBuild.character._ancestry.size),
    "data.traits.languages.value": parseLanguages(jsonBuild.build.languages),
    "data.traits.senses": parseSenses(jsonBuild.build.senses),
    "data.abilities.str.value": JSON.parse(jsonBuild.stats.totalAbilityScores)[0].Score,
    "data.abilities.dex.value": JSON.parse(jsonBuild.stats.totalAbilityScores)[1].Score,
    "data.abilities.con.value": JSON.parse(jsonBuild.stats.totalAbilityScores)[2].Score,
    "data.abilities.int.value": JSON.parse(jsonBuild.stats.totalAbilityScores)[3].Score,
    "data.abilities.wis.value": JSON.parse(jsonBuild.stats.totalAbilityScores)[4].Score,
    "data.abilities.cha.value": JSON.parse(jsonBuild.stats.totalAbilityScores)[5].Score,
    "data.saves.fortitude.rank": getProficiencyValue(jsonBuild.profs.Fortitude),
    "data.saves.reflex.rank": getProficiencyValue(jsonBuild.profs.Reflex),
    "data.saves.will.rank": getProficiencyValue(jsonBuild.profs.Will),
    "data.martial.advanced.rank": checkProficiencyValue(jsonBuild, "Advanced_Weapons"),
    "data.martial.heavy.rank": checkProficiencyValue(jsonBuild, "Heavy_Armor"),
    "data.martial.light.rank": checkProficiencyValue(jsonBuild, "Light_Armor"),
    "data.martial.medium.rank": checkProficiencyValue(jsonBuild, "Medium_Armor"),
    "data.martial.unarmored.rank": checkProficiencyValue(jsonBuild, "Unarmored_Defense"),
    "data.martial.martial.rank": checkProficiencyValue(jsonBuild, "Martial_Weapons"),
    "data.martial.simple.rank": checkProficiencyValue(jsonBuild, "Simple_Weapons"),
    "data.martial.unarmed.rank": checkProficiencyValue(jsonBuild, "Unarmed_Attacks"),
    "data.skills.acr.rank": checkProficiencyValue(jsonBuild, "Acrobatics"),
    "data.skills.arc.rank": checkProficiencyValue(jsonBuild, "Arcana"),
    "data.skills.ath.rank": checkProficiencyValue(jsonBuild, "Athletics"),
    "data.skills.cra.rank": checkProficiencyValue(jsonBuild, "Crafting"),
    "data.skills.dec.rank": checkProficiencyValue(jsonBuild, "Deception"),
    "data.skills.dip.rank": checkProficiencyValue(jsonBuild, "Diplomacy"),
    "data.skills.itm.rank": checkProficiencyValue(jsonBuild, "Intimidation"),
    "data.skills.med.rank": checkProficiencyValue(jsonBuild, "Medicine"),
    "data.skills.nat.rank": checkProficiencyValue(jsonBuild, "Nature"),
    "data.skills.occ.rank": checkProficiencyValue(jsonBuild, "Occultism"),
    "data.skills.prf.rank": checkProficiencyValue(jsonBuild, "Performance"),
    "data.skills.rel.rank": checkProficiencyValue(jsonBuild, "Religion"),
    "data.skills.soc.rank": checkProficiencyValue(jsonBuild, "Society"),
    "data.skills.ste.rank": checkProficiencyValue(jsonBuild, "Stealth"),
    "data.skills.sur.rank": checkProficiencyValue(jsonBuild, "Survival"),
    "data.skills.thi.rank": checkProficiencyValue(jsonBuild, "Thievery"),
    "data.attributes.perception.rank": getProficiencyValue(jsonBuild.profs.Perception),
    "data.attributes.classDC.rank": getProficiencyValue(jsonBuild.profs.Class_DC),
  });

  addLoreSkills(targetActor, jsonBuild.profs);
  addClass(targetActor, jsonBuild.character._class.name, jsonBuild.character.level);

  for (const item of await game.packs.get("pf2e.backgrounds").getDocuments()) {
    if (item.data.name == jsonBuild.character._background.name) {
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
    }
  }

  for (const item of await game.packs.get("pf2e.ancestries").getDocuments()) {
    if (item.data.name == jsonBuild.character._ancestry.name) {
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
    }
  }

  for (const item of await game.packs.get("pf2e.ancestryfeatures").getDocuments ()) {
    if (item.data.name == jsonBuild.character._heritage.name) {
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
    }
  }

  let featNames = await addFeats(targetActor, jsonBuild.build.feats, jsonBuild.character._background.name);
  console.log("-- Unimported Feats --");
  console.log(featNames);

  let itemNames = await addItems(targetActor, jsonBuild);
  console.log("-- Unimported Items --");
  console.log(itemNames);

  addSpells(targetActor, jsonBuild);

  let content = `
      <div>
        <p>The following items could not be automatically imported. Please check whether you need to add them manually:</p>
      <div>
      <hr/>`;

  if (featNames.size > 0) {
    content += `<h2>Feats</h2>
      <p>`+Array.from(featNames).join(", ")+`</p>`;
  }

  if (itemNames.size > 0) {
    content += `<h2>Equipment</h2>
      <p>`+Array.from(itemNames).join(", ")+`</p>`;
  }

  content += `<h2>Spellcasting</h2>
      <p>Wanderer's Guide Import does not currently support spellcasting. Please add any spells manually.</p>
      <br><br>
      `;

  new Dialog({
        title: "Import Complete",
        content: content,
        buttons: { no: { icon: "<i class='fas fa-check'></i>", label: "Done" } },
        default: "no",
    }).render(!0);
}

async function addLoreSkills(targetActor, profs) {
  let loresToAdd = [];
  for (const prof in profs) {
    if (prof.endsWith("Lore")) {
      loresToAdd.push({ name: prof, type: "lore", data: { proficient: { value: getProficiencyValue(profs[prof]) }, featType: "", mod: {value: 0}, item: {value: 0} } });
    }
  }
  await targetActor.createEmbeddedDocuments("Item", loresToAdd);
}

async function addClass(targetActor, className, level) {
  let classFeatureIDs = [];
  console.log("%cWanderer's Guide Import | %cSetting class to: " + className, pbcolor1, pbcolor4);
  for (const item of await game.packs.get("pf2e.classes").getDocuments()) {
    if (item.data.name == className) {
      //console.log(item);
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
      for (const classFeatureItem in item.data.data.items) {
        if (level >= item.data.data.items[classFeatureItem].level) {
          classFeatureIDs.push(item.data.data.items[classFeatureItem].id);
        }
      }
    }
  }
  addClassFeatureItems(targetActor, classFeatureIDs);
}

async function addClassFeatureItems(targetActor, classFeatureIDs) {
  let featuresToAdd = [];
  for (const item of await game.packs.get("pf2e.classfeatures").getDocuments()) {
    if (classFeatureIDs.includes(item.id)) {
      featuresToAdd.push(item.data);
    }
  }
  await targetActor.createEmbeddedDocuments("Item", featuresToAdd);
}

async function addFeats(targetActor, feats, backgroundName) {
  const featNames = new Set(feats.map((feat) => feat.value.name));
  let usedLocations = [];
  let featsToAdd = [];
  for (const item of await game.packs.get("pf2e.feats-srd").getDocuments()) {
    if (featNames.delete(item.data.name)) {
      const clonedData = JSON.parse(JSON.stringify(item.data));
      const feat = feats.find((feat) => feat.value.name == clonedData.name);
      let location = getFoundryFeatLocation(feat);
      if (location != null && !usedLocations.includes(location)) {
        if (location == "background-short") {
          location = targetActor.background.id;
        }
        clonedData.data.location = location;
        usedLocations.push(location);
      }
      featsToAdd.push(clonedData);
    }
  }
  let actionsToAdd = [];
  await targetActor.createEmbeddedDocuments("Item", featsToAdd);
  for (const item of await game.packs.get("pf2e.actionspf2e").getDocuments()) {
    if (featNames.delete(item.data.name)) {
      actionsToAdd.push(item.data);
    }
  }
  await targetActor.createEmbeddedDocuments("Item", actionsToAdd);
  return featNames;
}

async function addItems(targetActor, jsonBuild) {
  let equippedArmorID = jsonBuild.inventory.equippedArmorInvItemID;
  let equippedShieldID = jsonBuild.inventory.equippedShieldInvItemID;

  const itemNames = new Set(jsonBuild.invItems.map((item) => matchItemName(item.name).toLowerCase()));
  let itemsToAdd = [];
  for (const item of await game.packs.get("pf2e.equipment-srd").getDocuments()) {
    if (itemNames.delete(item.data.name.toLowerCase())) {
      const invItem = jsonBuild.invItems.find((invItem) => item.data.name.toLowerCase() == matchItemName(invItem.name).toLowerCase());
      if (item.data.type != "kit") {
          const clonedData = JSON.parse(JSON.stringify(item.data));
          clonedData.data.quantity.value = invItem.quantity;
          if (invItem.id == equippedArmorID || invItem.id == equippedShieldID || (invItem.itemIsWeapon == 1 && invItem.name != "Fist")) {
            clonedData.data.equipped.value = true;
          }
          itemsToAdd.push(clonedData);
      } else {
        itemsToAdd.push(item.data);
      }
    }
  }
  await targetActor.createEmbeddedDocuments("Item", itemsToAdd);
  return itemNames;
}

async function addSpells(targetActor, jsonBuild) {
  let spellSources = {};
  //console.log(jsonBuild.metaData);
  for (var i = 0; i < jsonBuild.metaData.length; i++) {
    var item = jsonBuild.metaData[i];
    if (item.source == "spellLists" || item.source == "spellCastingType" || item.source == "spellKeyAbilities" || item.source == "spellSlots") {
      var [source, data] = item.value.split("=");

      if (!(source in spellSources)) {
        spellSources[source] = { "name": source };
      }
    
      if (item.source == "spellLists") {
        spellSources[source]["tradition"] = data.toLowerCase();
      } else if (item.source == "spellCastingType") {
        spellSources[source]["type"] = data.split("-")[0].toLowerCase();
      } else if (item.source == "spellKeyAbilities") {
        spellSources[source]["ability"] = data.toLowerCase();
      } else if (item.source == "spellSlots") {
        const characterLevel = jsonBuild.character.level;
        const spellsJSON = JSON.parse(data);
        const spellLevels = ["firstLevel", "secondLevel", "thirdLevel", "fourthLevel", "fifthLevel", "sixthLevel", "seventhLevel", "eighthLevel", "ninthLevel", "tenthLevel"];
        for (const spellLevel of spellLevels) {
          let numSlots = 0;
          for (const slot of spellsJSON[spellLevel]) {
            if (slot["level_lock"] <= characterLevel) {
              if (!("level_cutoff" in slot && slot["level_cutoff"] <= characterLevel)) {
                numSlots++;
              }
            }
          }
          spellSources[source][spellLevel] = numSlots;
        }
      }

      if (!("ability" in spellSources[source])) {
        spellSources[source]["ability"] = "cha";
      }

      if (!("type" in spellSources[source])) {
        spellSources[source]["type"] = "innate";
      }

      if ("tradition" in spellSources[source]) {
        switch (spellSources[source]["tradition"]) {
          case "divine":
            spellSources[source]["proficiency"] = checkProficiencyValue(jsonBuild, "DivineSpellDCs");
            break;
          case "arcane":
            spellSources[source]["proficiency"] = checkProficiencyValue(jsonBuild, "ArcaneSpellDCs");
            break;
          case "occult":
            spellSources[source]["proficiency"] = checkProficiencyValue(jsonBuild, "OccultSpellDCs");
            break;
          case "primal":
            spellSources[source]["proficiency"] = checkProficiencyValue(jsonBuild, "PrimalSpellDCs");
            break;
          default:
            spellSources[source]["proficiency"] = 0;
        }
      }
    }
  }

  for (const source in spellSources) {
    spellCasterInstance = [{ name: capitalizeFirstLetter(source) + " Spells", type: "spellcastingEntry", data: 
      { 
        ability: { type: "String", label: "Spellcasting Ability", value: spellSources[source]["ability"] },
        // focus: { points: 1, pool: 1 },
        proficiency: { value: spellSources[source]["proficiency"] },
        // spelldc: { type: "String", label: "Class DC", item: 0 },
        tradition: { type: "String", label: "Magic Tradition", value: spellSources[source]["tradition"] },
        prepared: { type: "String", label: "Spellcasting Type", value: spellSources[source]["type"]},
        slots: {
            slot0: { max: 0, prepared: [], value: 0 },
            slot1: { max: spellSources[source]["firstLevel"], prepared: [], value: spellSources[source]["firstLevel"] },
            slot2: { max: spellSources[source]["secondLevel"], prepared: [], value: spellSources[source]["secondLevel"] },
            slot3: { max: spellSources[source]["thirdLevel"], prepared: [], value: spellSources[source]["thirdLevel"] },
            slot4: { max: spellSources[source]["fourthLevel"], prepared: [], value: spellSources[source]["fourthLevel"] },
            slot5: { max: spellSources[source]["fifthLevel"], prepared: [], value: spellSources[source]["fifthLevel"] },
            slot6: { max: spellSources[source]["sixthLevel"], prepared: [], value: spellSources[source]["sixthLevel"] },
            slot7: { max: spellSources[source]["seventhLevel"], prepared: [], value: spellSources[source]["seventhLevel"] },
            slot8: { max: spellSources[source]["eighthLevel"], prepared: [], value: spellSources[source]["eighthLevel"] },
            slot9: { max: spellSources[source]["ninthLevel"], prepared: [], value: spellSources[source]["ninthLevel"] },
            slot10: { max: spellSources[source]["tenthLevel"], prepared: [], value: spellSources[source]["tenthLevel"] },
        },
        showUnpreparedSpells: { value: !1 },
      }
    }];
    const instance = await targetActor.createEmbeddedDocuments("Item", spellCasterInstance);
    console.log(instance[0].id);
    spellSources[source]["locationID"] = instance[0].id; 
  }
  
  const spellNames = new Set(jsonBuild.spellBookSpells.map((item) => item._spellName.toLowerCase()));
  console.log(spellNames);
  let spellsToAdd = [];
  for (const item of await game.packs.get("pf2e.spells-srd").getDocuments()) {
    if (spellNames.delete(item.data.name.toLowerCase())) {
      const clonedData = JSON.parse(JSON.stringify(item.data));
      const spellItem = jsonBuild.spellBookSpells.find((spellItem) => item.data.name.toLowerCase() == spellItem._spellName.toLowerCase());
      clonedData.data.level.value = spellItem["spellLevel"];
      clonedData.data.location.value = spellSources[spellItem["spellSRC"]]["locationID"];
      console.log(clonedData);
      spellsToAdd.push(clonedData);
      console.log(spellItem);
    }
  }
  await targetActor.createEmbeddedDocuments("Item", spellsToAdd);
}

function capitalizeFirstLetter(string) {
  if (string.split(" ").length == 1) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  } else {
    return capitalizeFirstLetter(string.substr(0, string.indexOf(" "))) + " " + capitalizeFirstLetter(string.substr(string.indexOf(" ") + 1));
  }
}

function getSizeValue(size) {
    switch (size) {
        case "TINY":
            return "tiny";
        case "SMALL":
            return "sm";
        case "LARGE":
            return "lg";
    }
    return "med";
}

function checkProficiencyValue(jsonBuild, profName) {
  if (jsonBuild.profs[profName]) {
    return getProficiencyValue(jsonBuild.profs[profName]);
  } else {
    return 0;
  }
}

function getProficiencyValue(prof) {
  switch (prof) {
    case "T":
      return 1;
    case "E":
      return 2;
    case "M":
      return 3;
    case "L":
      return 4;
  }
  return 0;
}

function parseLanguages(languages) {
  const languageNames = languages.map(function(language) {
    return language.value.name.toLowerCase();
  });
  console.log (languageNames);
  return languageNames;
}

function parseSenses(senses) {
  const senseNames = senses.map(function(sense) {
    if (sense.value.name === "Low-Light Vision") {
      return { exceptions: "", label: "Low-Light Vision", type: "lowLightVision", value: "" };
    } else if (sense.value.name == "Darkvision") {
      return { exceptions: "", label: "Darkvision", type: "darkvision", value: "" };
    }
  });
  console.log (senseNames);
  return senseNames;
}

function parseKeyAbility(jsonBuild) {
  const abilities = jsonBuild.character._class.keyAbility.split(" or ");
  if (abilities.length == 1) {
    //console.log(jsonBuild.character._class.keyAbility);
    return getAbilityAbbreviation(jsonBuild.character._class.keyAbility);
  } else {
    const firstAbility = JSON.parse(jsonBuild.stats.totalAbilityScores)[abilityScores.indexOf(abilities[0])];
    const secondAbility = JSON.parse(jsonBuild.stats.totalAbilityScores)[abilityScores.indexOf(abilities[1])];

    if (secondAbility.Score > firstAbility.Score) {
      //console.log(secondAbility.Name);
      return getAbilityAbbreviation(secondAbility.Name);
    } else {
      //console.log(firstAbility.Name);
      return getAbilityAbbreviation(firstAbility.Name);
    }
  }
}

function getAbilityAbbreviation(ability) {
  return ability.toLowerCase().substring(0, 3);
}

function getFoundryFeatLocation(feat) {
  if (feat.sourceType == "ancestry") {
    return "ancestry-" + feat.sourceLevel;
  } else if (feat.sourceType == "background") {
    return "background-short";
  } else if (feat.sourceType == "class") {
    if (feat.value.genericType == "SKILL-FEAT") {
      return "skill-" + feat.sourceLevel;
    } else if (feat.value.genericType == "GENERAL-FEAT") {
      return "general-" + feat.sourceLevel;
    } else {
      return "class-" + feat.sourceLevel;
    }
  }
  return null;
}

function matchItemName(itemName) {
  if (itemName.endsWith("(chunk)")) {
    return itemName.replace("(chunk)", "Chunk");
  } else if (itemName.endsWith("(ingot)")) {
    return itemName.replace("(chunk)", "Ingot");
  }
  //TODO: scrolls and wands??
  const changeNames = [
        { name: "Mug (wooden)", newname: "Mug" },
        { name: "Rations (1 week)", newname: "Rations" },
        { name: "Playing Cards (marked)", newname: "Marked Playing Cards" },
        { name: "Rope (50 feet)", newname: "Rope" },
        { name: "Predictable Silver (sp)", newname: "Predictable Silver Piece" },
        { name: "Wayfinder (archaic)", newname: "Archaic Wayfinder" },
        { name: "Astrolabe (mariner's)", newname: "Mariner's Astrolabe" },
        { name: "Wayfinder (fashionable)", newname: "Fashionable Wayfinder" },
        { name: "Book of Translation (advanced)", newname: "Advanced Book of Translation (Tien)" },
        { name: "Hype (diluted)", newname: "Diluted Hype" },
        { name: "Deteriorating Dust (extended)", newname: "Extended Deteriorating Dust" },
        { name: "Wayfinder (chronicler)", newname: "Chronicler Wayfinder" },
        { name: "Dragon's Breath Potion (young)", newname: "Red Dragon's Breath Potion (Young)" },
        { name: "Deteriorating Dust (caustic)", newname: "Caustic Deteriorating Dust" },
        { name: "Wayfinder (elemental - air)", newname: "Elemental Wayfinder (Air)" },
        { name: "Wayfinder (elemental - fire)", newname: "Elemental Wayfinder (Fire)" },
        { name: "Wayfinder (elemental - earth)", newname: "Elemental Wayfinder (Earth)" },
        { name: "Wayfinder (elemental - water)", newname: "Elemental Wayfinder (Water)" },
        { name: "Wayfinder (razmiri)", newname: "Razmiri Wayfinder" },
        { name: "Dragon's Breath Potion (adult)", newname: "Red Dragon's Breath Potion (Adult)" },
        { name: "Hype (plasma)", newname: "Plasma Hype" },
        { name: "Wayfinder (hummingbird)", newname: "Hummingbird Wayfinder" },
        { name: "Wayfinder (homeward)", newname: "Homeward Wayfinder" },
        { name: "Dragon's Breath Potion (wyrm)", newname: "Red Dragon's Breath Potion (Wyrm)" },
        { name: "Gold (gp)", newname: "Gold Pieces" },
        { name: "Silver (sp)", newname: "Silver Pieces" },
        { name: "Copper (cp)", newname: "Copper Pieces" },
        { name: "Platinum (pp)", newname: "Platinum Pieces" },
        { name: "Conrasu Exoskeleton", newname: "Rite of Reinforcement Exoskeleton" },
        { name: "Hide", newname: "Hide Armor" },
        { name: "Leather", newname: "Leather Armor" },
        { name: "Studded Leather", newname: "Studded Leather Armor" },
        { name: "High-Fashion Fine Clothing", newname: "Clothing (High-Fashion Fine)" },
        { name: "Explorer's Clothing", newname: "Clothing (Explorer's)" },
        { name: "Winter Clothing", newname: "Clothing (Winter)" },
        { name: "Fine Clothing", newname: "Clothing (Fine)" },
        { name: "Ordinary Clothing", newname: "Clothing (Ordinary)" },
        { name: "Sling Bullet", newname: "Sling Bullets" },
        { name: "Arrow", newname: "Arrows" },
        { name: "Blowgun Dart", newname: "Blowgun Darts" },
        { name: "Bolt", newname: "Bolts" },
        { name: "", newname: "" },
        { name: "", newname: "" },
        { name: "", newname: "" },
        { name: "", newname: "" },
    ];
    var newNameIdx = changeNames.findIndex(function (item) {
        return item.name == itemName;
    });
    return -1 < newNameIdx ? changeNames[newNameIdx].newname : itemName;
}
