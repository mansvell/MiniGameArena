(() => {
  const THEME_KEY = "miniArena.theme.v1";

  function applyTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    document.body.classList.toggle("dark", saved === "dark");
  }

  function toggleTheme() {
    const isDark = !document.body.classList.contains("dark");
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();

    // Comme chaque page a son propre header, on cherche le bouton si il existe
    const btn = document.getElementById("toggleThemeBtn");
    if (btn) btn.addEventListener("click", toggleTheme);
  });
})();
