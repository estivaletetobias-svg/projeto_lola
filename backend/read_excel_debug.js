const ExcelJS = require('exceljs');
const path = require('path');

const filePath = "/Users/tobiasestivalete/Projeto Lola/Tabelas pesquisa Lola/Copy of Folha_Referente a Dezembro.25 (1).xlsx";

console.log('Lendo arquivo:', filePath);

const workbook = new ExcelJS.Workbook();
workbook.xlsx.readFile(filePath)
  .then(() => {
    const worksheet = workbook.getWorksheet(1);
    console.log('Planilha encontrada:', worksheet.name);
    
    // Pegar cabeçalhos (linha 1)
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers.push({ col: colNumber, value: cell.value });
    });
    
    // Pegar as primeiras 3 linhas de dados
    const sampleData = [];
    for (let i = 2; i <= 5; i++) {
      const row = worksheet.getRow(i);
      if (row.values.length > 0) {
        const rowData = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers.find(h => h.col === colNumber);
          const key = header ? header.value : `col_${colNumber}`;
          rowData[key] = cell.value;
        });
        sampleData.push(rowData);
      }
    }
    
    console.log('Resultados:');
    console.log(JSON.stringify({ headers: headers.map(h => h.value), sampleData }, null, 2));
  })
  .catch(err => {
    console.error('Erro ao ler a planilha:', err);
    process.exit(1);
  });
