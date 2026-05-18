<script setup lang="ts"></script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span>© 2026 DiceyRoom</span>
      </div>
      <nav class="footer-nav">
        <a href="#">이용약관</a>
        <a href="#">개인정보처리방침</a>
        <a href="#">License</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--color-border);
  padding: 1.25rem 1.5rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.footer-nav {
  display: flex;
  gap: 1.25rem;
}

.footer-nav a:hover {
  color: var(--color-red);
}
</style>
