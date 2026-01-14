<template>
  <Header.default />
  <main>
    <div class="mainContainer" v-if="!tasks">Loading...</div>
    <div class="mainContainer" v-else>
      <div class="title">
        <button class="dangerButton" @click="deleteCollection">delete collection</button>
        <router-link class="button" :to="`/collections/${props.id}/tasks/create`"
          >create task</router-link
        >
        <router-link class="button" :to="`/collections/${props.id}/users`"
          >get users in this collection</router-link
        >
        <router-link class="button" :to="`/collections/${props.id}/add/user`">add user</router-link>
      </div>
      <h2 v-if="error" class="error">{{ error }}</h2>
      <div class="tasksContainer">
        <div v-for="task in tasks.tasks" :key="task.id" class="task">
          <div class="taskTitles">
            <p class="name">{{ task.name }}</p>
            <p class="priority">priority: {{ task.priority }}</p>
            <p class="status">status: {{ task.status }}</p>
          </div>
          <div class="taskButtons">
            <button class="dangerButton" @click="deleteTask(task.id)">delete</button>
            <button class="button" @click="changeTaskStatus(task.id)">change status</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import * as Header from "@/components/HeaderComponent.vue";
import { ref, onMounted } from "vue";
import axios, { AxiosError } from "axios";
import { useRouter } from "vue-router";

interface ITasks {
  page: number;
  totalPages: number;
  tasks: {
    id: string;
    collectionId: string;
    name: string;
    description: string;
    priority: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

const router = useRouter();

const tasks = ref<null | ITasks>(null);
const error = ref<string>("");

const props = defineProps<{
  id: string;
}>();

async function deleteCollection() {
  try {
    error.value = "";

    await axios.delete(`${import.meta.env.VITE_API_URL}/collections/${props.id}`, {
      withCredentials: true,
    });

    router.push("/profile");
  } catch (err: unknown) {
    if (err instanceof AxiosError && err.response?.status === 401) {
      router.push("/auth/register");
    } else if (err instanceof AxiosError) {
      error.value = err.response?.data?.message || "An error occurred";
    }
  }
}

async function deleteTask(taskId: string) {
  error.value = "";

  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/collections/${props.id}/tasks/${taskId}`, {
      withCredentials: true,
    });

    if (tasks.value) {
      tasks.value.tasks = tasks.value.tasks.filter((task) => task.id !== taskId);
    }
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      error.value = err.response?.data?.message || "An error occurred";
    } else {
      error.value = "An error occurred";
    }
  }
}

async function changeTaskStatus(taskId: string) {
  error.value = "";

  const value = prompt("choose one option:\n1: new\n2: in_process\n3: completed\n4: canceled");

  const map: Record<number, string> = {
    1: "new",
    2: "in_process",
    3: "completed",
    4: "canceled",
  };

  if (Number(value) !== 1 && Number(value) !== 2 && Number(value) !== 3 && Number(value) !== 4) {
    alert("invalid options");
    return;
  }

  try {
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/collections/${props.id}/tasks/${taskId}/status`,
      {
        status: map[Number(value)],
      },
      {
        withCredentials: true,
      },
    );

    if (tasks.value) {
      const task = tasks.value.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = map[Number(value)];
      }
    }
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      error.value = err.response?.data?.message || "An error occurred";
    } else {
      error.value = "An error occurred";
    }
  }
}

onMounted(async () => {
  try {
    const getTasksResponse = await axios.get(
      `${import.meta.env.VITE_API_URL}/collections/${props.id}/tasks`,
      {
        withCredentials: true,
      },
    );

    tasks.value = getTasksResponse.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError && err.response?.status === 401) {
      router.push("/auth/register");
    }
  }
});
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  width: 100vw;
  align-items: center;
}

.mainContainer {
  width: 90%;
  max-width: 1200px;
}

.title {
  margin-top: 10px;
  display: flex;
  width: 100%;
  justify-content: flex-end;
}

.task {
  border-bottom: 1px solid var(--border-color);
  margin: 20px 0px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.task .name {
  font-size: 22px;
  font-weight: 600;
}

.task .priority {
  font-size: 20px;
  font-weight: 400;
}

.task .status {
  font-size: 20px;
  font-weight: 400;
}

.taskButtons {
  display: flex;
  flex-direction: column;
}
</style>
