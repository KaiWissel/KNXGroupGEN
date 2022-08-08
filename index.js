const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Struktur
// Hauptgruppen -> Mittelgruppen -> "auffüllen"

const Zentral = { Zeit: ["Datum", "Uhrzeit"], Alarm: ["Windalarm"] };

const Licht = {
  Zentral: [],
  Schalten: [],
  Status: [],
  Dimmen: [],
  D_Wert: [],
};

const Heizung = {
  Zentral: [],
  Ist_Wert: [],
  Soll_Wert: [],
  Ventil_Stellung: [],
};

const Beschattung = {
  Zentral: [],
  J_Kurz: [],
  J_Lang: [],
};

const Praesenz = {
  Zentral: [],
  Helligkeit: [],
};

const Hauptgruppen = { Zentral, Licht, Heizung, Beschattung, Praesenz };

// Einträge in dieser Liste werden nicht aufgefüllt
const blacklist = ["Zentral"];
const seperator = ";";
const quote = '"';
const furtherColumns = {
  Central: { placeholder: "" },
  Unfiltered: { placeholder: "" },
  Description: { placeholder: "" },
  DatapointType: { placeholder: "" },
  Security: { placeholder: "Auto" },
};

let roomSpacing = 5;
let rooms = [];
let projectName = "KNXGrpGEN";

readInputs();

function readInputs() {
  readline.question(`Bitte geben den Namen des Projektes an: `, (name) => {
    console.log(`Projektname: ${name}`);
    projectName = name;
    readline.question(
      `Bitte geben die Räume in einer kommaseparierten Liste an: `,
      (roomNames) => {
        rooms = roomNames.split(",");
        console.log(`Räume: ${rooms}`);
        readline.question(
          `Bitte das Spacing für die Adressen zwischen den Räumen an: `,
          (spacing) => {
            console.log(`Spacing: ${spacing}`);
            roomSpacing = spacing;
            readline.close();
            createCsv();
          }
        );
      }
    );
  });
}

function createCsv() {
  console.log("Starte mit der CSV-Erstellung");

  let fileContent = "";
  for (
    let indexMain = 0;
    indexMain < Object.keys(Hauptgruppen).length;
    indexMain++
  ) {
    const mainElement = Object.keys(Hauptgruppen)[indexMain];
    fileContent += createLine(mainElement, indexMain);

    const middleElements = Object.values(Hauptgruppen)[indexMain];
    for (
      let indexMiddle = 0;
      indexMiddle < Object.keys(middleElements).length;
      indexMiddle++
    ) {
      const middleElement = Object.keys(middleElements)[indexMiddle];
      fileContent += createLine(middleElement, indexMain, indexMiddle);

      const grpElements = middleElements[middleElement];
      if (grpElements.length > 0) {
        // Gruppenadressen sind bereits definiert
        for (let indexGrp = 0; indexGrp < grpElements.length; indexGrp++) {
          const grpElement = grpElements[indexGrp];
          fileContent += createLine(
            grpElement,
            indexMain,
            indexMiddle,
            indexGrp
          );
        }
      } else {
        // Wenn keine Gruppenadressen definiert dann erzeuge Default-Adressen für die Mittelgruppen die nicht auf der Blacklist stehen
        if (!blacklist.includes(middleElement)) {
          let indexRoom = 5;
          rooms.forEach((room) => {
            fileContent += createLine(
              mainElement[0] + "_" + middleElement.substring(0, 3) + "_" + room,
              indexMain,
              indexMiddle,
              indexRoom
            );
            indexRoom += roomSpacing;
          });
        }
      }
    }
  }

  writeCsvToDisk(fileContent);
}

function createLine(grpElement, indexMain, indexMiddle, indexGrp) {
  const group_name = quote + grpElement + quote;
  const address = createAddress(indexMain, indexMiddle, indexGrp);
  let line = group_name + seperator + address;
  return addPlaceholder(line) + "\n";
}

function createAddress(indexMain = "-", indexMiddle = "-", indexGrp = "-") {
  // 0/0/0 ist eine reservierte Adresse
  if (indexMain == 0 && indexMiddle == 0 && indexGrp >= 0) indexGrp++;
  return quote + `${indexMain}/${indexMiddle}/${indexGrp}` + quote;
}

function addPlaceholder(line) {
  Object.values(furtherColumns).forEach((col) => {
    if (col.placeholder) line += seperator + quote + col.placeholder + quote;
    else line += seperator + quote + quote;
  });
  return line;
}

function writeCsvToDisk(fileContent) {
  fs.writeFile(projectName + ".csv", fileContent, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("CSV-Erstellung beendet");
  });
}
