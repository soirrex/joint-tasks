<template>
  <main>
    <form @submit.prevent="submitForm">
      <p>Create task</p>
      <label>Task name</label>
      <input type="text" placeholder="name" v-model="taskName" required />
      <label>Priority</label>
      <input type="text" placeholder="priority" v-model="taskPriority" required />
      <label>description</label>
      <input type="text" placeholder="description" v-model="taskDescription" />
      <span class="error">{{ error }}</span>
      <button type="submit" className="button">Create</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import axios, { AxiosError } from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

const error = ref("");
const taskName = ref("");
const taskPriority = ref("");
const taskDescription = ref("");

const props = defineProps<{
  id: string;
}>();

async function submitForm() {
  error.value = "";

  if (
    taskPriority.value.trim().toLowerCase() !== "low" &&
    taskPriority.value.trim().toLowerCase() !== "mid" &&
    taskPriority.value.trim().toLowerCase() !== "high"
  ) {
    error.value = "priority must be a low, mid or high";
    return;
  }
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/collections/${props.id}/tasks`,
      {
        name: taskName.value,
        priority: taskPriority.value,
        description: taskDescription.value,
      },
      {
        withCredentials: true,
      },
    );
    router.push(`/collections/${props.id}`);
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
  width: 100vw;
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
