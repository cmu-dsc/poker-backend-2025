import { CognitoJwtVerifier } from "aws-jwt-verify";
import { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import env from 'src/config/env';

const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_APP_CLIENT_ID,
});

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const cognitoAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    let payload = await cognitoVerifier.verify(token).catch(async () => {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      return ticket.getPayload();
    });

    if (payload?.sub) {
      // @ts-ignore
      req.userId = payload.sub;
      next();
    } else {
      res.status(401).json({ message: 'Invalid token payload' });
    }
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default cognitoAuthMiddleware;
