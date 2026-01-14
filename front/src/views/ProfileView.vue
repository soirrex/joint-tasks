<template>
  <Header.default />
  <main>
    <div class="mainCollection" v-if="!user || !collections">Loading...</div>
    <div class="mainCollection" v-else>
      <div class="userCollection">
        <span class="userName">Name: {{ user.name }}</span>
        <span class="userId">ID: {{ user.id }}</span>
      </div>
      <div class="collectionsCollection">
        <div class="titleCollection">
          <p>Collections</p>
          <router-link class="button" to="/collections/create">Create collection</router-link>
        </div>
        <div v-if="collections.collections.length < 1">No collections found.</div>
        <div v-for="collection in collections.collections" :key="collection.id">
          <div class="collections">
            <div class="collection">
              <div>
                <p class="collectionName">name: {{ collection.name }}</p>
                <p class="createdAt">created at: {{ formatDate(collection.createdAt) }}</p>
                <span v-if="collection.isCreator">you are the creator of this collection</span>
              </div>
              <div class="buttonsContainer">
                <router-link class="button" :to="`/collections/${collection.id}`">open</router-link>
              </div>
            </div>
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

interface IUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ICollections {
  id: string;
  creatorId: string;
  isCreator: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userRights: {
    rightToCreate: boolean;
    rightToEdit: boolean;
    rightToDelete: boolean;
    rightToChangeStatus: boolean;
  };
}

const router = useRouter();

const error = ref<string>("");
const user = ref<IUser | null>(null);
const collections = ref<ICollections | null>(null);

const formatDate = (date: string) => new Date(date).toLocaleDateString();

onMounted(async () => {
  try {
    const responseUser = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
      withCredentials: true,
    });

    const responseCollections = await axios.get(`${import.meta.env.VITE_API_URL}/collections`, {
      withCredentials: true,
    });

    user.value = responseUser.data.user;
    collections.value = responseCollections.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError && err.response?.status === 401) {
      router.push("/auth/register");
    } else {
      error.value = "An error occurred";
    }
  }
});
</script>

<style scoped>
main {
  width: 100%;
  display: flex;
  justify-content: center;
}

.mainCollection {
  max-width: 1200px;
  width: 90%;
}

.userCollection {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
}

.userCollection .userName {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--text-color);
}

.userCollection .userId {
  font-size: 1rem;
  font-weight: 500;
  color: var(--second-text-color);
}

.collectionsCollection {
  margin-top: 20px;
}

.titleCollection {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.titleCollection p {
  font-size: 1.5rem;
  font-weight: 500;
}

.collections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 15px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.collection {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.collection span {
  color: var(--text-color);
  font-weight: 400;
  font-size: 14px;
}

.collectionName {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.collectionCreatedAt {
  color: var(--second-text-color);
}
</style>
