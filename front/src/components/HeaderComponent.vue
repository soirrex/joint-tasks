<template>
  <header>
    <div class="mainContainer">
      <p class="title">joint-tasks</p>
      <div v-if="isAuth" class="buttonsContainer"></div>
      <div v-else class="buttonsContainer">
        <router-link to="/auth/register" class="linkButton">Register</router-link>
        <router-link to="/auth/login" class="button">Login</router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Cookie from "js-cookie";

const isAuth = ref(false);

onMounted(() => {
  isAuth.value = Cookie.get("isAuth") === "true";
});
</script>

<style scoped>
header {
  width: 100vw;
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.mainContainer {
  max-width: 1200px;
  width: 90%;
}

.mainContainer {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
