export type StoredUser = {
  _id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
};

export const getStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoredUser) : null;
  } catch (_error) {
    return null;
  }
};

export const getStoredUserName = () => getStoredUser()?.name?.trim() || "";

export const storeUser = (user: unknown) => {
  if (!user || typeof user !== "object") return;
  localStorage.setItem("user", JSON.stringify(user));
};
