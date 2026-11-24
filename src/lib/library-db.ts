import type { Model } from './coordinates'

const store = 'models'

function openLibrary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brickgpt-studio', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(store, { keyPath: 'id' })
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function loadModels(): Promise<Model[]> {
  const database = await openLibrary()
  try {
    return await new Promise<Model[]>((resolve, reject) => {
      const transaction = database.transaction(store, 'readonly')
      const request = transaction.objectStore(store).getAll()
      request.onsuccess = () => {
        const models: Model[] = request.result
        resolve(models.sort((left, right) => (left.importedAt ?? 0) - (right.importedAt ?? 0)))
      }
      request.onerror = () => reject(request.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}

export async function saveModels(models: Model[]): Promise<void> {
  if (models.length === 0) return
  const database = await openLibrary()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(store, 'readwrite')
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error ?? new Error('保存到本地失败。'))
      const modelsStore = transaction.objectStore(store)
      for (const model of models) modelsStore.put(model)
    })
  } finally {
    database.close()
  }
}
