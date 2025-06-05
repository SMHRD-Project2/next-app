import oracledb from 'oracledb';

// Thick 모드용 클라이언트 경로 설정
oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_19_26' }); // 환경에 맞게 수정

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name } = req.body;
  let connection;

  console.log('요청 받은 데이터:', req.body);

  try {
    connection = await oracledb.getConnection({
      user: 'tenny10',
      password: '101010',
      connectString: 'project-db-cgi.smhrd.com:1524/xe',
    });

    console.log('DB 연결 성공');

    // 회원가입 처리
    const result = await connection.execute(
      `
      INSERT INTO TB_USER (USER_ID, USER_EMAIL, USER_TOKEN, USER_NAME, USER_ROLE, JOINED_AT)
      VALUES (TB_USER_SEQ.NEXTVAL, :email, :password, :name, 'user', SYSTIMESTAMP)
      RETURNING USER_ID INTO :userId
      `,
      { 
        email, 
        password, 
        name,
        userId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    // 새로 생성된 사용자 정보 조회
    const userResult = await connection.execute(
      `SELECT USER_ID, USER_EMAIL, USER_NAME, USER_ROLE 
       FROM TB_USER 
       WHERE USER_ID = :userId`,
      { userId: result.outBinds.userId[0] }
    );

    const user = {
      id: userResult.rows[0][0],
      email: userResult.rows[0][1],
      name: userResult.rows[0][2],
      role: userResult.rows[0][3]
    };

    await connection.close();
    return res.status(200).json({ 
      message: '회원가입 성공',
      user 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'DB 오류 발생' });
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
