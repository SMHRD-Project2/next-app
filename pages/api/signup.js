import oracledb from 'oracledb';

// Thick 모드용 클라이언트 경로 설정
oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_19_26' }); // 환경에 맞게 수정

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name } = req.body;

  console.log('요청 받은 데이터:', req.body);


  try {
    const connection = await oracledb.getConnection({
      user: 'tenny10',
      password: '101010',
      connectString: 'project-db-cgi.smhrd.com:1524/xe',
    });

    console.log('DB 연결 성공');

    const result = await connection.execute(
      `
      INSERT INTO TB_USER (USER_ID, USER_EMAIL, USER_TOKEN, USER_NAME, USER_ROLE, JOINED_AT)
      VALUES (TB_USER_SEQ.NEXTVAL, :email, :password, :name, 'user', SYSTIMESTAMP)
      `,
      { email, password, name },
      { autoCommit: true }
    );

    await connection.close();
    return res.status(200).json({ message: '회원가입 성공' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'DB 오류 발생' });
  }
}
