const maxRetries = 3;

export async function createWithRetry(createFn, retries = 0) {
  try {
    return await createFn();
  } catch (error) {
    if (retries < maxRetries) {
      console.log(`重試 ${retries + 1} 次...`);
      return createWithRetry(createFn, retries + 1);
    } else {
      throw new Error(`重試 ${maxRetries} 次後仍然失敗: ${error.message}`);
    }
  }
}
