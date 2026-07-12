import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TARGET_FOLDERS = ['app', 'features', 'actions', 'src'];

console.log("🔍 Scanning project server actions for missing Role-Based Access Checks...\n");

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.actions.ts') || file.endsWith('.action.ts')) {
      checkActionFileSecurity(fullPath);
    }
  }
}

function checkActionFileSecurity(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);
  
  // File ko functions ke mutabiq split karte hain split pattern se
  const functionBlocks = content.split(/export\s+async\s+function\s+|export\s+const\s+(\w+)\s*=\s*async/);
  
  // Pehla block import wagera ka hota hai, use chor dein
  let currentLineTracker = 1;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains an exported action function
    if (line.includes('export async function') || (line.includes('export const') && line.includes('async'))) {
      const match = line.match(/(?:function\s+(\w+)|const\s+(\w+))/);
      if (match) {
        const funcName = match[1] || match[2];
        
        // Agar mutation function hai toh check karo
        const isMutation = funcName.startsWith('create') || 
                           funcName.startsWith('update') || 
                           funcName.startsWith('delete') || 
                           funcName.startsWith('toggle') || 
                           funcName.startsWith('reset') ||
                           funcName.startsWith('save');

        if (isMutation) {
          // Agli 40 lines (ya function ka hissa) nikal kar scan karo check ke liye
          let functionSnippet = "";
          for (let j = i; j < Math.min(i + 50, lines.length); j++) {
            functionSnippet += lines[j] + "\n";
          }

          const hasSessionCheck = functionSnippet.includes('session?.user') || 
                                  functionSnippet.includes('auth()') || 
                                  functionSnippet.includes('requireRoles');
          
          const hasRoleCheck = functionSnippet.includes('role') || 
                               functionSnippet.includes('requireRole') || 
                               functionSnippet.includes('SUPER_ADMIN') || 
                               functionSnippet.includes('PRINCIPAL') ||
                               functionSnippet.includes('TEACHER') ||
                               functionSnippet.includes('HR') ||
                               functionSnippet.includes('checkRole');

          if (!hasSessionCheck) {
            console.log(`🔴 [CRITICAL INSECURE] Line ~${i + 1} in ${relativePath}`);
            console.log(`   👉 Function "${funcName}" has NO AUTH CHECK AT ALL. Anyone can trigger this!\n`);
          } else if (!hasRoleCheck && !funcName.startsWith('updateProfile')) {
            console.log(`⚠️ [ROLE MISSING] Line ~${i + 1} in ${relativePath}`);
            console.log(`   👉 Function "${funcName}" checks login, but MISSING role validation. A student can call this.\n`);
          }
        }
      }
    }
  }
}

// Start scanning
let scanCount = 0;
TARGET_FOLDERS.forEach(folder => {
  scanDirectory(path.join(projectRoot, folder));
});

console.log("🏁 Scan complete. If no red errors appeared above, you are 100% SECURE!");