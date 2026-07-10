const jwt = require('jsonwebtoken');
const secret = 'cPApJ5wVctfSWB69/ExDissWw9CNDKVnwWPVMSvLZjq03qIplxEd4Kq4zq48nu91LZpXnGeaowWr4MDrOQw7ig==';
try {
  const token = jwt.sign({ sub: '123' }, secret);
  console.log('Signed with string directly:', token);
  jwt.verify(token, secret);
  console.log('Verify with string directly works for OUR signed token.');
} catch (e) {
  console.log('Failed:', e.message);
}
