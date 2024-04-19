const { verifyLogin } = require("@thirdweb-dev/auth/evm");
const admin = require('firebase-admin');

exports.authToken = async function login(req, res) {
  // Grab the login payload the user sent us with their request.
  const payload = req.body.payload;

  const { address, error } = await verifyLogin(
    process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
    payload
  );
  if (!address) {
    return res.status(401).json({ error });
  }

  // Generate a JWT token for the user to be used on the client-side.
  const token = await admin.auth().createCustomToken(address);

  // Send the token to the client side.
  return res.status(200).json({ token });
};
