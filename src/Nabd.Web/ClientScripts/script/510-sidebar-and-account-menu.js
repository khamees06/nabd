    /* Sidebar & Account Dropdown Controls */
    function openSidebar() {
      document.getElementById('sidebar-backdrop')?.classList.remove('hidden');
      const sb = document.getElementById('app-sidebar');
      if (sb) {
        sb.classList.remove('-translate-x-full');
        sb.setAttribute('aria-hidden', 'false');
      }
    }

    function closeSidebar() {
      document.getElementById('sidebar-backdrop')?.classList.add('hidden');
      const sb = document.getElementById('app-sidebar');
      if (sb) {
        sb.classList.add('-translate-x-full');
        sb.setAttribute('aria-hidden', 'true');
      }
    }

    function toggleAccountDropdown() {
      const menu = document.getElementById('account-dropdown-menu');
      const btn = document.getElementById('user-menu-btn');
      if (!menu || !btn) return;
      const isHidden = menu.classList.contains('hidden');
      if (isHidden) {
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        closeAccountDropdown();
      }
    }

    function closeAccountDropdown() {
      const menu = document.getElementById('account-dropdown-menu');
      const btn = document.getElementById('user-menu-btn');
      if (menu) menu.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

