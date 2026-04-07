"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const openai_1 = __importDefault(require("openai"));
const pdfParse = require('pdf-parse');
async function testExtraction() {
    console.log("🚀 Iniciando Motor de Extração de IA...");
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
    }
    const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
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
    const jsonResult = JSON.parse(resultText);
    console.log("\n✅ DADOS EXTRAÍDOS COM SUCESSO (Amostra - Top 3):");
    console.table(jsonResult.employees.slice(0, 3));
    console.log(`\n🎉 Total de registros perfeitos arranjados no JSON: ${jsonResult.employees.length} colaboradores.`);
}
testExtraction().catch(console.error);
//# sourceMappingURL=test-ai-extraction.js.map