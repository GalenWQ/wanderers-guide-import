const abilityScores = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
var applyChanges = !1;

console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", function() {
  console.log("This code runs once the Foundry VTT software begins it's initialization workflow.");
});

Hooks.on("ready", function() {
  console.log("This code runs once core initialization is ready and game data is available.");
});

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

function importCharacter(targetActor, jsonBuild) {
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