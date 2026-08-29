# Cloud Firestore setup

1. Create a Firebase project and add a **Web app** in the Firebase console.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. Create a Cloud Firestore database, then deploy the production-oriented rules from `firestore.rules` in the Firestore Rules console.
4. Copy `.env.example` to `.env.local`, then replace every value with the Web app configuration from Firebase.
5. In Google Cloud Console → **IAM & Admin → Service Accounts**, generate a private JSON key. Store it outside the repository and set `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` to its absolute path.
6. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME` in `.env.local`, then run `npm run seed:admin`. This creates the first Firebase Authentication user and `users/{UID}` document with role `owner`.
7. Restart `npm run dev` after changing environment variables.

The app stores workspace users in the `users` collection and download pages in the `projects` collection. Both collections are observed in real time. If a newly connected Firestore database has no data, the app creates the existing demo data once using stable document IDs.

An `owner` or `editor` may enter the admin area; a `viewer` may not. Firebase Authentication persists the session locally when “Remember me” is enabled, so opening `/` or `/admin` takes an active administrator directly to `/admin/projects`.
