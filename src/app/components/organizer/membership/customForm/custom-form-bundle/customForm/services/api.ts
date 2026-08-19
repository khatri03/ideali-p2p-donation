import HttpClient from "app/service/httpClient/HttpClient";

const inFlightGetRequests = new Map<string, Promise<unknown>>();

export async function postJson<T>(path: string, body: unknown) {
  const response = await HttpClient.post<T>(path, body);
  return response.data;
}

export async function putJson<T>(path: string, body: unknown) {
  const response = await HttpClient.put<T>(path, body);
  return response.data;
}

export async function getJson<T>(path: string) {
  const requestKey = path;
  const existingRequest = inFlightGetRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = HttpClient.get<T>(path)
    .then((response) => response.data)
    .finally(() => {
      inFlightGetRequests.delete(requestKey);
    });

  inFlightGetRequests.set(requestKey, request as Promise<unknown>);
  return request;
}

export async function openBinaryFile(path: string) {
  const response = await HttpClient.get(path, {
    responseType: "blob",
  });
  return window.URL.createObjectURL(response.data);
}

export async function downloadBinaryFile(path: string, fileName?: string | null) {
  const response = await HttpClient.get(path, {
    responseType: "blob",
  });
  const blob = response.data as Blob;
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
