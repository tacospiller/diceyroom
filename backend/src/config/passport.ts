import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { env } from "./env";

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        // "openid" only: the userinfo response carries just the `sub` claim,
        // so we never receive (or store) the user's email, name, or photo.
        scope: ["openid"],
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        // profile.id is the Google account id (OpenID `sub`) — the only thing
        // we take from Google. Account lookup/creation happens in the route.
        done(null, { googleId: profile.id });
      }
    )
  );
}
