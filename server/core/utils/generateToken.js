const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ user: { id: id } }, process.env.JWT_SECRET, {
    expiresIn: '30d', // トークンの有効期限を30日に設定
  });
};

module.exports = generateToken;