import { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'
import env from 'src/config/env'
import { ApiError, ApiErrorCodes } from '../errorhandler/APIError'

// Initialize Firebase Admin SDK
admin.initializeApp({
  // Add your Firebase admin credentials here
  credential: admin.credential.cert(JSON.parse(env.GCLOUD_ADMIN_KEY!)),
})

// Middleware function to validate Firebase auth header
export const firebaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get the Firebase auth header from the request
    const authHeader: string | undefined = req.headers.authorization

    if (!authHeader) {
      res.status(401).send('Authorization header missing')
      return
    }

    // Extract the Firebase ID token from the auth header
    const [, idToken]: string[] = authHeader.split(' ')

    // Verify the ID token using Firebase Admin SDK
    const decodedToken: admin.auth.DecodedIdToken = await admin
      .auth()
      .verifyIdToken(idToken)

    // Check if the ID token belongs to a Google account
    if (decodedToken.firebase.sign_in_provider !== 'google.com') {
      res.status(401).send('Invalid auth provider')
      return
    }

    // Attach the decoded token to the request object for further use
    // @ts-ignore
    req.decodedToken = decodedToken

    // Validate that the Google account email ends with 'cmu.edu'
    const email: string | undefined = decodedToken.email
    if (!email || !email.endsWith('cmu.edu')) {
      res.status(401).send('Invalid email domain')
      return
    }

    // attach users andrew id to the request object
    // @ts-ignore
    req.andrewId = email.split('@')[0]

    // Call the next middleware or route handler
    next()
  } catch (error) {
    res.status(401).send('Invalid auth token')
    return
  }
}
