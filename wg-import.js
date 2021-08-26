const abilityScores = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
var applyChanges = !1;
const pbcolor1 = "color: #7bf542",
    pbcolor2 = "color: #d8eb34",
    pbcolor3 = "color: #ffffff",
    pbcolor4 = "color: #cccccc",
    pbcolor5 = "color: #ff0000";

//TODO: spellcasting
//TODO: custom proficiencies/bonus feats
//TODO: variant rules
//TODO: lores
//TODO: containers
//TODO: animal companions/familiars?
//TODO: instructions/warnings
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
        <p>Paste the full text of a .guidechar file below:</p>
      <div>
      <hr/>
      <form>
        <textarea id="inputArea"></textarea>
      </form>
      <br><br>
      <style>

      </style>
      `,
        buttons: { yes: { icon: "<i class='fas fa-check'></i>", label: "Import", callback: () => (applyChanges = !0) }, no: { icon: "<i class='fas fa-times'></i>", label: "Cancel" } },
        default: "yes",
        close: (html) => {
            applyChanges &&
                (validateInput(targetActor, html.find('[id="inputArea"]')[0].value))
        },
    }).render(!0);
}

function validateInput(targetActor, str) {
  var jsonBuild;
  try {
    jsonBuild = JSON.parse(str);
    console.log(jsonBuild.character.name)
  } catch (e) {
    ui.notifications.warn("guidechar file invalid");
    return;
  }
  importCharacter(targetActor, jsonBuild);
  //TODO: move back into try block
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

  let classFeatureIDs = [];
  console.log("%cWanderer's Guide Import | %cSetting class to: " + jsonBuild.character._class.name, pbcolor1, pbcolor4);
  for (const item of await game.packs.get("pf2e.classes").getDocuments()) {
    if (item.data.name == jsonBuild.character._class.name) {
      console.log(item);
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
      for (const classFeatureItem in item.data.data.items) {
        if (jsonBuild.character.level >= item.data.data.items[classFeatureItem].level) {
          classFeatureIDs.push(item.data.data.items[classFeatureItem].id);
        }
      }
    }
  }
  addClassFeatureItems(targetActor, classFeatureIDs);

  for (const item of await game.packs.get("pf2e.backgrounds").getDocuments()) {
    if (item.data.name == jsonBuild.character._background.name) {
      console.log(item);
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
    }
  }

  for (const item of await game.packs.get("pf2e.ancestries").getDocuments()) {
    if (item.data.name == jsonBuild.character._ancestry.name) {
      console.log(item);
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
    }
  }

  for (const item of await game.packs.get("pf2e.ancestryfeatures").getDocuments ()) {
    if (item.data.name == jsonBuild.character._heritage.name) {
      await targetActor.createEmbeddedDocuments("Item", [item.data]);
    }
  }

  let featNames = jsonBuild.build.feats.map((feat) => feat.value.name);
  let featsToAdd = [];
  for (const item of await game.packs.get("pf2e.feats-srd").getDocuments()) {
    if (featNames.includes(item.data.name)) {
      const clonedData = JSON.parse(JSON.stringify(item.data));
      const feat = jsonBuild.build.feats.filter((feat) => feat.value.name == clonedData.name);
      const location = getFoundryFeatLocation(feat[0]);
      if (location != null) {
        console.log(clonedData.name + " " + location);
        clonedData.data.location = location;
      }
      featsToAdd.push(clonedData);
    }
  }
  await targetActor.createEmbeddedDocuments("Item", featsToAdd);

  let equippedArmorID = jsonBuild.inventory.equippedArmorInvItemID;
  let equippedShieldID = jsonBuild.inventory.equippedShieldInvItemID;

  let itemsToAdd = [];
  for (const item of await game.packs.get("pf2e.equipment-srd").getDocuments()) {
    for (const invItem of jsonBuild.invItems) {

      //TODO: weapon and armor runes??
      const itemName = matchItemName(invItem.name);
      if (item.data.name.toLowerCase() == itemName.toLowerCase()) {
        console.log("ITEM:");
        console.log (item);
        if (item.data.type != "kit") {
          const clonedData = JSON.parse(JSON.stringify(item.data));
          clonedData.data.quantity.value = invItem.quantity;
          if (invItem.id == equippedArmorID || invItem.id == equippedShieldID || (invItem.itemIsWeapon == 1 && invItem.name != "Fist")) {
            console.log ("EQUIPPED");
            clonedData.data.equipped.value = true;
          }
          itemsToAdd.push(clonedData);
        } else {
          itemsToAdd.push(item.data);
        }
        break;
      }
    }
  }
  await targetActor.createEmbeddedDocuments("Item", itemsToAdd);

  // for (const item of jsonBuild.metaData) {

  // }
}

async function addClassFeatureItems(targetActor, classFeatureIDs) {
  let featuresToAdd = [];
  for (const item of await game.packs.get("pf2e.classfeatures").getDocuments()) {
    if (classFeatureIDs.includes(item.id)) {
      console.log(item);
      featuresToAdd.push(item.data);
    }
  }
  await targetActor.createEmbeddedDocuments("Item", featuresToAdd);
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
    console.log(jsonBuild.character._class.keyAbility);
    return getAbilityAbbreviation(jsonBuild.character._class.keyAbility);
  } else {
    const firstAbility = JSON.parse(jsonBuild.stats.totalAbilityScores)[abilityScores.indexOf(abilities[0])];
    const secondAbility = JSON.parse(jsonBuild.stats.totalAbilityScores)[abilityScores.indexOf(abilities[1])];

    if (secondAbility.Score > firstAbility.Score) {
      console.log(secondAbility.Name);
      return getAbilityAbbreviation(secondAbility.Name);
    } else {
      console.log(firstAbility.Name);
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
    return "skill-BG";
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
        { name: "", newname: "" },
    ];
    var newNameIdx = changeNames.findIndex(function (item) {
        return item.name == itemName;
    });
    return -1 < newNameIdx ? changeNames[newNameIdx].newname : itemName;
}
