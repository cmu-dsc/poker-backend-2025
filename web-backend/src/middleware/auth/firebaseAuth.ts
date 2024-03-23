import { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'
import { ApiError, ApiErrorCodes } from '../errorhandler/APIError'
import env from 'src/config/env'

// Initialize Firebase Admin SDK
admin.initializeApp({
  // Add your Firebase admin credentials here
  credential: admin.credential.cert(JSON.parse(env.GCLOUD_ADMIN_KEY!)),
})

// Middleware function to validate Firebase auth header
export const firebaseAuthMiddleware = async (
  req: Request & { decodedToken?: admin.auth.DecodedIdToken, andrewId: string }, // Add 'decodedToken' property to Request type
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get the Firebase auth header from the request
    const authHeader: string | undefined = req.headers.authorization

    if (!authHeader) {
      throw new ApiError(
        ApiErrorCodes.UNAUTHORIZED,
        'Authorization header missing',
      )
    }

    // Extract the Firebase ID token from the auth header
    const [, idToken]: string[] = authHeader.split(' ')

    // Verify the ID token using Firebase Admin SDK
    const decodedToken: admin.auth.DecodedIdToken = await admin
      .auth()
      .verifyIdToken(idToken)

    // Check if the ID token belongs to a Google account
    if (decodedToken.firebase.sign_in_provider !== 'google.com') {
      throw new ApiError(ApiErrorCodes.UNAUTHORIZED, 'Invalid auth provider')
    }

    // Attach the decoded token to the request object for further use
    req.decodedToken = decodedToken

    // Validate that the Google account email ends with 'cmu.edu'
    const email: string | undefined = decodedToken.email
    if (!email || !email.endsWith('cmu.edu')) {
      throw new ApiError(ApiErrorCodes.UNAUTHORIZED, 'Invalid email domain')
    }

    // attach users andrew id to the request object
    req.andrewId = email.split('@')[0]

    // Call the next middleware or route handler
    next()
  } catch (error) {
    throw new ApiError(ApiErrorCodes.UNAUTHORIZED, 'Invalid auth token')
  }
}
