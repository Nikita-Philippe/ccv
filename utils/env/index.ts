export const persistEnv = (key: string) => {
    const value = Deno.env.get(key);
    if (!value) return;

    
}