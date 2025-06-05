// import oracledb from 'oracledb';

// oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_19_26' });

// export default async function handler(req, res) {
//   let connection;

//   try {
//     connection = await oracledb.getConnection({
//       user: 'tenny10',
//       password: '101010',
//       connectString: 'project-db-cgi.smhrd.com:1524/xe',
//     });

//     const result = await connection.execute(`SELECT * FROM TB_USER`);

//     console.log('Query Result:', result.rows);

//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ error: 'DB query failed' });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error('Error closing connection:', err);
//       }
//     }
//   }
// }

export const runtime = 'nodejs';

import oracledb from 'oracledb';

oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_19_26' });

export default async function handler(req, res) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: 'tenny10',
      password: '101010',
      connectString: 'project-db-cgi.smhrd.com:1524/xe',
    });

    const result = await connection.execute(`SELECT * FROM TB_USER`);

    console.log('Query Result:', result.rows);

    return res.status(200).json(result.rows);




  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'DB query failed' });



    
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}
