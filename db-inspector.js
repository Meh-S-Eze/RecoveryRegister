const postgres = require('postgres');

// Create a connection using the same method as the application
const sql = postgres(process.env.DATABASE_URL);

async function inspectDatabase() {
  try {
    // List all tables in the database
    console.log('=== Database Tables ===');
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
    
    // For each table, show its structure
    console.log('\n=== Table Schemas ===');
    for (const tableRow of tables) {
      const tableName = tableRow.table_name;
      console.log(`\nTable: ${tableName}`);
      
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;
      
      columns.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Sample data from each table
    console.log('\n=== Sample Data ===');
    for (const tableRow of tables) {
      const tableName = tableRow.table_name;
      console.log(`\nSample from ${tableName}:`);
      
      const sampleData = await sql`
        SELECT * FROM ${sql(tableName)} LIMIT 5;
      `;
      
      if (sampleData.length === 0) {
        console.log(`  No data in ${tableName}`);
      } else {
        console.table(sampleData);
      }
    }
  } catch (err) {
    console.error('Error inspecting database:', err);
  } finally {
    // Close the connection
    await sql.end();
  }
}

inspectDatabase(); 