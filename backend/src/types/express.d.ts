declare global {
  namespace Express {
    // Passport's verify callback populates req.user with the authenticated
    // Google account id (only). Account lookup/creation happens in the route.
    interface User {
      googleId: string;
    }

    interface Request {
      auth?: { userId: string };
    }
  }
}

export {};
