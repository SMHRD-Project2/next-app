import oracledb from 'oracledb';

oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_19_26' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: 'tenny10',
      password: '101010',
      connectString: 'project-db-cgi.smhrd.com:1524/xe',
    });

    const result = await connection.execute(
      `SELECT USER_ID, USER_EMAIL, USER_NAME, USER_ROLE 
       FROM TB_USER 
       WHERE USER_EMAIL = :email AND USER_TOKEN = :password`,
      { email, password }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const user = {
      id: result.rows[0][0],
      email: result.rows[0][1],
      name: result.rows[0][2],
      role: result.rows[0][3]
    };

    return res.status(200).json({ 
      message: '로그인 성공',
      user 
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
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