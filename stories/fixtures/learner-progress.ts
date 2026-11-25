// Return the cleanup function Storybook runs when the story unmounts.
export function seedProgress(key: string, value: string) {
  const previous = localStorage.getItem(key);
  localStorage.setItem(key, value);
  return () => {
    if (previous === null) localStorage.removeItem(key);
    else localStorage.setItem(key, previous);
  };
}
