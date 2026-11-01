import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

let authToken = null;
export function setAuthToken(t) {
  authToken = t || null;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

export function formatApiError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((x) => (x && typeof x.msg === "string" ? x.msg : "")).filter(Boolean).join("، ") || "يرجى التحقق من البيانات المدخلة";
  if (detail && typeof detail.msg === "string") return detail.msg;
  return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى";
}

export function imgSrc(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${BACKEND_URL}${u}`;
}

export function waLink(number, text) {
  if (!number) return "";
  return `https://wa.me/${String(number).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text || "")}`;
}

export function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default api;
