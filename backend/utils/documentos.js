const fs = require('fs').promises;
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'documentos.json');

async function readDocumentos() {
  try {
    const data = await fs.readFile(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const empty = { documentos: [] };
      await writeDocumentos(empty);
      return empty;
    }
    throw err;
  }
}

// Escribe de forma atómica: tmp → rename, evita corrupción ante fallo de proceso
async function writeDocumentos(data) {
  const tmp = FILE_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, FILE_PATH);
}

function agruparPorDepartamento(documentos) {
  const mapa = {};
  for (const doc of documentos) {
    if (!mapa[doc.departamento]) {
      mapa[doc.departamento] = [];
    }
    mapa[doc.departamento].push(doc);
  }
  return Object.entries(mapa)
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([nombre, docs]) => ({ nombre, documentos: docs }));
}

module.exports = { readDocumentos, writeDocumentos, agruparPorDepartamento };
