<template>
  <main>
    <form @submit.prevent="submitForm">
      <p>Login</p>
      <label>Email</label>
      <input type="email" placeholder="Email" v-model="form.email" required />
      <label>Password</label>
      <input type="password" placeholder="Password" v-model="form.password" required />
      <span class="error">{{ error }}</span>
      <button type="submit" class="button">Login</button>
      <span>
        Doesn't have a account?
        <router-link to="/auth/login" class="linkButton">Register</router-link>
      </span>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

const router = useRouter();
const error = ref();

const form = reactive({
  email: "",
  password: "",
});

async function submitForm() {
  error.value = "";

  if (!form.email || !form.password) {
    error.value = "Please fill in all fields";
    return;
  } else if (form.password.length < 6) {
    error.value = "Password must be at least 6 characters long";
    return;
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    error.value = "Please enter a valid email address";
    return;
  }

  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      {
        email: form.email,
        password: form.password,
      },
      {
        withCredentials: true,
      },
    );

    Cookies.set("isAuth", "true");
    router.push("/");
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      error.value = err.response?.data?.message || "An error occurred";
    } else {
      error.value = "An error occurred";
    }
  }
}
</script>

<style scoped>
main {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

form p {
  margin-bottom: 15px;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-color);
}

form label {
  margin-bottom: 5px;
  font-size: 1rem;
  color: var(--text-color);
}

form button {
  margin: 5px 0px;
  padding: 10px;
}

form span {
  margin-top: 5px;
  width: 100%;
  text-align: center;
}
</style>
