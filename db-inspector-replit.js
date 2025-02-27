const postgres = require('postgres');

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

async function inspectDatabase() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set.');
      console.log('Please set it in Replit Secrets or in your environment.');
      return;
    }

    printDbEnv();
    
    // Create a connection using the same method as the application
    const sql = postgres(process.env.DATABASE_URL);

    // List all tables in the database
    console.log('\n=== Database Tables ===');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if (tables.length === 0) {
      console.log('No tables found in the database.');
    } else {
      tables.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Close the connection
    await sql.end();
  } catch (err) {
    console.error('Error inspecting database:', err);
  }
}

// Run the inspection
inspectDatabase(); 