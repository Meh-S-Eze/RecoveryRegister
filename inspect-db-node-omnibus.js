const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to check if a file exists
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

// Read environment variables from .env file
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (fileExists(envPath)) {
    console.log('Loading environment variables from .env file');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n');
    
    envVars.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

// Print environment variables related to the database
function printDbEnv() {
  console.log('=== Database Environment Variables ===');
  const dbVars = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'];
  
  dbVars.forEach(varName => {
    if (process.env[varName]) {
      if (varName === 'PGPASSWORD' || varName === 'DATABASE_URL') {
        console.log(`${varName}: ******** (hidden for security)`);
      } else {
        console.log(`${varName}: ${process.env[varName]}`);
      }
    } else {
      console.log(`${varName}: Not set`);
    }
  });
}

// Run CLI commands to inspect the database
function inspectDbUsingCli() {
  try {
    // Attempt to list tables using a CLI command
    console.log('\n=== Database Tables (via CLI) ===');
    const tables = execSync(`echo "\\dt" | psql "$DATABASE_URL" -t`, { encoding: 'utf8' });
    console.log(tables || 'No tables found');
  } catch (error) {
    console.error('Error executing CLI command:', error.message);
  }
}

// Main function
async function main() {
  loadEnv();
  printDbEnv();
  inspectDbUsingCli();
}

main(); 