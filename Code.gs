// Google Apps Script: pegar en script.google.com (ver LEEME.txt)
const FOLDER_ID = "1noPsJF8_4j7mBN54GVw9ndx1gYP_O-q8"; // tu carpeta de Drive
const NOMBRE = "Confirmaciones_Candela_XV";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const d = JSON.parse(e.postData.contents);
    const carpeta = DriveApp.getFolderById(FOLDER_ID);
    const ss = obtenerPlanilla_(carpeta);          // la crea con la 1.ª confirmación
    const hoja = ss.getSheets()[0];
    hoja.appendRow([hoja.getLastRow(), d.nombre, d.fecha, d.hora]); // luego solo agrega filas
    SpreadsheetApp.flush();
    guardarExcel_(ss, carpeta);                    // sube/actualiza el .xlsx en la carpeta
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return ContentService.createTextOutput("Funcionando"); }

function obtenerPlanilla_(carpeta) {
  const it = carpeta.getFilesByName(NOMBRE);
  while (it.hasNext()) {
    const f = it.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) return SpreadsheetApp.open(f);
  }
  const ss = SpreadsheetApp.create(NOMBRE);
  DriveApp.getFileById(ss.getId()).moveTo(carpeta);
  const hoja = ss.getSheets()[0];
  hoja.setName("Confirmaciones");
  hoja.appendRow(["N°", "Nombre y Apellido", "Fecha", "Hora"]);
  hoja.getRange(1, 1, 1, 4).setFontWeight("bold");
  hoja.setColumnWidth(2, 280);
  return ss;
}

function guardarExcel_(ss, carpeta) {
  const url = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?format=xlsx";
  const blob = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  }).getBlob().setName(NOMBRE + ".xlsx");
  const viejos = carpeta.getFilesByName(NOMBRE + ".xlsx");
  while (viejos.hasNext()) viejos.next().setTrashed(true);
  carpeta.createFile(blob);
}
