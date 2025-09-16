import { apiRequest } from "./queryClient";

export async function getJson<T>(url: string): Promise<T> {
  const res = await apiRequest("GET", url);
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function postJson<T>(url: string, data: unknown): Promise<T> {
  const res = await apiRequest("POST", url, data);
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function putJson<T>(url: string, data: unknown): Promise<T> {
  const res = await apiRequest("PUT", url, data);
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function deleteRequest(url: string): Promise<void> {
  await apiRequest("DELETE", url);
}
