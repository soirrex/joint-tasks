import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/auth/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
    },
    {
      path: "/auth/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("@/views/ProfileView.vue"),
    },
    {
      path: "/collections/create",
      name: "create collection",
      component: () => import("@/views/CreateCollectionView.vue"),
    },
    {
      path: "/collections/:id",
      name: "collection",
      component: () => import("@/views/CollectionView.vue"),
      props: true,
    },
  ],
});

export default router;
