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
    {
      path: "/collections/:id/tasks/create",
      name: "create task",
      component: () => import("@/views/CreateTaskView.vue"),
      props: true,
    },
    {
      path: "/collections/:id/add/user",
      name: "add user to collection",
      component: () => import("@/views/AddUserToCollectionView.vue"),
      props: true,
    },
    {
      path: "/collections/:id/users",
      name: "all users in collection",
      component: () => import("@/views/UsersRightsInCollectionView.vue"),
      props: true,
    },
  ],
});

export default router;
