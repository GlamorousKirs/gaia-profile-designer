// public/search-worker.js
self.onmessage = function (e) {
  const { snippets, query, showDefaults } = e.data;
  const cleanQuery = query.toLowerCase().trim();

  const filtered = snippets.filter((item) => {
    if (!showDefaults && item.isDefault) return false;
    if (!cleanQuery) return true;
    
    return (
      item.title.toLowerCase().includes(cleanQuery) ||
      item.code.toLowerCase().includes(cleanQuery)
    );
  });

  // Return maximum 200 items to the UI layer to maintain optimal memory windowing
  self.postMessage(filtered.slice(0, 200));
};