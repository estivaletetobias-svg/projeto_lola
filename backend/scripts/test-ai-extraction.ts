import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
const pdfParse = require('pdf-parse');

async function testExtraction() {
    console.log("🚀 Iniciando Motor de Extração de IA...");
    
    // Load OpenAI API Key gracefully
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Using one of the specific PDFs mentioned
    const pdfPath = '/Users/tobiasestivalete/Projeto Lola/Tabelas pesquisa Lola/Modelos de Folha de Pagamento/Folha de pagamento (72).pdf';
    console.log(`\n📄 Lendo arquivo PDF: ${pdfPath}`);
    
    const buffer = fs.readFileSync(pdfPath);
    console.log("🔍 Extraindo texto base...");
    const pdfData = await pdfParse(buffer);
    const textContent = pdfData.text;
    
    console.log("🧠 Enviando dados textuais para Inteligência Artificial (OpenAI GPT-4o)...");
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `You are an elite payroll data extraction engine. You will be given raw text extracted from a PDF payroll slip/spreadsheet.
                Extract ALL employee rows. Ensure numbers are properly formatted as floats (e.g., 5000.00 not 5.000,00).
                Return a strictly valid JSON object with a single root key 'employees', containing an array of objects.
                Each object MUST matching this TS interface exactly:
                {
                    employee_key: string; 
                    full_name: string; 
                    area: string; 
                    base_salary: number; 
                    benefits: number; 
                    variable: number; 
                }`
            },
            {
                role: "user",
                content: textContent
            }
        ]
    });

    const resultText = response.choices[0].message.content;
    const jsonResult = JSON.parse(resultText!);
    
    console.log("\n✅ DADOS EXTRAÍDOS COM SUCESSO (Amostra - Top 3):");
    console.table(jsonResult.employees.slice(0, 3));
    console.log(`\n🎉 Total de registros perfeitos arranjados no JSON: ${jsonResult.employees.length} colaboradores.`);
}

testExtraction().catch(console.error);
