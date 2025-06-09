import oracledb from "oracledb";

oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_19_26' }); // 250605 박남규: Thick 모드 설정

// 250605 박남규 추가: LOB 데이터 처리 함수
async function readLob(lob) {
  return new Promise((resolve, reject) => {
    if (!lob) {
      resolve(null);
      return;
    }
    let data = '';
    lob.setEncoding('utf8');
    lob.on('data', (chunk) => data += chunk);
    lob.on('end', () => resolve(data));
    lob.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET method is allowed" });
  }

  let connection;

  try {
    connection = await oracledb.getConnection({
      user: 'tenny10',
      password: '101010',
      connectString: 'project-db-cgi.smhrd.com:1524/xe',
    });

    const result = await connection.execute(
      `SELECT SEN_TYPE AS TYPE, SEN_TEXT AS TEXT FROM TB_SENTENCE`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 250605 박남규 수정: LOB 데이터 처리
    const processedRows = await Promise.all(result.rows.map(async (row) => ({
      TYPE: row.TYPE,
      TEXT: (typeof row.TEXT === 'object' && row.TEXT !== null) ? await readLob(row.TEXT) : row.TEXT,
    })));

    const grouped = processedRows.reduce((acc, row) => {
      const type = row.TYPE.toLowerCase();
      if (!acc[type]) acc[type] = [];
      acc[type].push(row.TEXT);
      return acc;
    }, {});

    res.status(200).json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}
