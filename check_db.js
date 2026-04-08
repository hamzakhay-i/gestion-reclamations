const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    const [dbs] = await conn.execute("SHOW DATABASES LIKE 'reclamations_db'");
    console.log('Base de donnees existe:', dbs.length > 0);

    await conn.changeUser({ database: 'reclamations_db' });

    const [tables] = await conn.execute('SHOW TABLES');
    console.log('\nTables:', tables.map(t => Object.values(t)[0]));

    const [users] = await conn.execute('SELECT id, name, email, role, is_active FROM users');
    console.log('\nUtilisateurs:');
    console.table(users);

    const [recCols] = await conn.execute('DESCRIBE reclamations');
    console.log('\nTable reclamations:');
    console.table(recCols.map(c => ({ Field: c.Field, Type: c.Type, Key: c.Key })));

    const [resCols] = await conn.execute('DESCRIBE responses');
    console.log('\nTable responses:');
    console.table(resCols.map(c => ({ Field: c.Field, Type: c.Type, Key: c.Key })));

    await conn.end();
}

check().catch(e => console.error('Erreur:', e.message));
