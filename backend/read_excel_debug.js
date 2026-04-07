const ExcelJS = require('exceljs');
const path = require('path');

const filePath = "/Users/tobiasestivalete/Projeto Lola/Tabelas pesquisa Lola/Copy of Folha_Referente a Dezembro.25 (1).xlsx";

console.log('--- 🚀 Lola Data Validator 1.0 ---');
console.log('Lendo arquivo:', path.basename(filePath));

const workbook = new ExcelJS.Workbook();

async function processFile() {
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      console.error('❌ Nenhuma planilha encontrada no arquivo.');
      return;
    }

    console.log('✅ Planilha detectada:', worksheet.name);
    console.log('📊 Total de linhas:', worksheet.rowCount);

    // 1. Identificar Cabeçalhos
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers.push({ 
        col: colNumber, 
        value: cell.value ? String(cell.value).trim() : `col_${colNumber}` 
      });
    });

    console.log('\n🔍 Cabeçalhos Identificados:');
    headers.forEach(h => console.log(`  [${h.col}] ${h.value}`));

    // 2. Processar Dados com Validação Inteligente
    const employees = [];
    const errors = [];
    
    // Pular cabeçalho (i=2)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData = {};
      let hasData = false;
      
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers.find(h => h.col === colNumber);
        const key = header ? header.value : `col_${colNumber}`;
        
        let value = cell.value;
        
        // Tratar valores do Excel (Fórmulas, Objetos, etc)
        if (value && typeof value === 'object' && value.result !== undefined) {
          value = value.result; // Caso seja fórmula
        }

        rowData[key] = value;
        if (value !== null && value !== undefined && value !== '') hasData = true;
      });

      if (hasData) {
        employees.push({
          id: rowNumber,
          data: rowData
        });
      }
    });

    console.log(`\n✅ Processamento concluído: ${employees.length} funcionários encontrados.`);

    // 3. Amostra para Diagnóstico de Job Match (Simular os primeiros 5)
    console.log('\n🧪 Amostra para Simulação de Job Match (Primeiros 5):');
    const sample = employees.slice(0, 5).map(emp => {
      // Tentar identificar campos chave comuns
      const d = emp.data;
      return {
        Original_Name: d['Nome'] || d['NOME'] || d['Colaborador'] || 'N/A',
        Original_Role: d['Cargo'] || d['CARGO'] || d['Função'] || 'N/A',
        Original_Salary: d['Salário'] || d['SALARIO BASE'] || d['Base'] || 0,
        Area: d['Área'] || d['DEPARTAMENTO'] || d['Setor'] || 'N/A'
      };
    });
    console.table(sample);

  } catch (err) {
    console.error('❌ Erro crítico ao processar Excel:', err.message);
  }
}

processFile();
