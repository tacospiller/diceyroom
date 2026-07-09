import { defineStore } from "pinia";
import type { User } from "../types";
import * as api from "../api/client";

type Status = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: Status;
  accessToken: string | null;
  user: User | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    status: "idle",
    accessToken: null,
    user: null,
  }),
  getters: {
    // Authenticated AND registered (has a user record).
    isRegistered: (s): boolean => s.status === "authenticated" && !!s.user,
  },
  actions: {
    setSession(accessToken: string, user: User | null) {
      this.accessToken = accessToken;
      this.user = user;
      this.status = user ? "authenticated" : "unauthenticated";
    },

    reset() {
      this.accessToken = null;
      this.user = null;
      this.status = "unauthenticated";
    },

    /** Restore a session from the refresh cookie, if any. Safe to call once. */
    async loadSession() {
      if (this.status === "loading") return;
      this.status = "loading";
      try {
        const { accessToken, user } = await api.refresh();
        this.setSession(accessToken, user);
      } catch {
        this.reset();
      }
    },

    async register(input: {
      registrationTicket: string;
      username: string;
      profileImage?: File | null;
    }) {
      const { accessToken, user } = await api.register(input);
      this.setSession(accessToken, user);
    },

    async logout() {
      try {
        await api.logout();
      } finally {
        this.reset();
      }
    },
  },
});
