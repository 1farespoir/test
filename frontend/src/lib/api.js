import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// localStorage key for the candidate interview code (cross-browser fallback for
// browsers that block third-party cookies — Safari, Brave, Firefox strict, iOS, etc.)
export const INTERVIEW_CODE_KEY = "scorebar_interview_code";

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Auto-attach the interview code on every API request so the backend's
// `get_interview_access` helper can authorize candidates without relying on cookies.
api.interceptors.request.use((config) => {
  try {
    const code = localStorage.getItem(INTERVIEW_CODE_KEY);
    if (code) {
      config.headers = config.headers || {};
      config.headers["x-interview-code"] = code;
    }
  } catch { /* localStorage unavailable (private mode etc.) — fall back to cookie */ }
  return config;
});

export function setInterviewCode(code) {
  try { if (code) localStorage.setItem(INTERVIEW_CODE_KEY, code); } catch { /* ignore */ }
}

export function clearInterviewCode() {
  try { localStorage.removeItem(INTERVIEW_CODE_KEY); } catch { /* ignore */ }
}

export async function get(path) { return (await api.get(path)).data; }
export async function post(path, body) { return (await api.post(path, body)).data; }
