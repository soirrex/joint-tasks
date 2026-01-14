<template>
  <main>
    <form @submit.prevent="submitForm">
      <p>Set user rights in collection</p>
      <label>User id</label>
      <input type="text" placeholder="user id" v-model="userId" required />
      <div class="checkboxes">
        <label>
          <input type="checkbox" v-model="rights.rightToCreate" />
          Right to create
        </label>
        <label>
          <input type="checkbox" v-model="rights.rightToEdit" />
          Right to edit
        </label>
        <label>
          <input type="checkbox" v-model="rights.rightToDelete" />
          Right to delete
        </label>
        <label>
          <input type="checkbox" v-model="rights.rightToChangeStatus" />
          Right to change status
        </label>
      </div>
      <span class="error">{{ error }}</span>
      <button type="submit" class="button">Create</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import axios, { AxiosError } from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const error = ref("");
const userId = ref("");

const rights = reactive({
  rightToCreate: false,
  rightToEdit: false,
  rightToDelete: false,
  rightToChangeStatus: false,
});

const props = defineProps<{
  id: string;
}>();

async function submitForm() {
  error.value = "";

  if (!userId.value.trim()) {
    error.value = "User ID is required";
    return;
  }

  try {
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/collections/${props.id}/users/${userId.value.trim()}`,
      rights,
      { withCredentials: true },
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

.checkboxes {
  display: flex;
  flex-direction: column;
  margin: 10px 0;
}

.checkboxes label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  margin-bottom: 5px;
}
</style>
