const API = import.meta.env.VITE_API_BASE || ''
export async function apiFetch(path, token, options = {}){
const res = await fetch(`${API}${path}`, {
...options,
headers: { ...(options.headers||{}), Authorization: token ? `Bearer ${token}` : undefined }
})
if (!res.ok) throw new Error(await res.text())
return res.json()
}