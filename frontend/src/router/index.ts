import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RegisterView from "../views/RegisterView.vue";
import AuthCallbackView from "../views/AuthCallbackView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    // Backend redirects failed OAuth here (?error=oauth); same screen as home.
    { path: "/login", name: "login", component: HomeView },
    // Backend redirects existing users here after OAuth.
    { path: "/auth/callback", name: "auth-callback", component: AuthCallbackView },
    // Backend redirects new users here with #ticket=<jwt>.
    { path: "/register", name: "register", component: RegisterView },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

export default router;
