/* =========================================================
   «Зерно & Тепло» — вся интерактивность сайта
   Меню, корзина, конструктор, темы, FAQ, форма, анимации
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_THEME = "zerno-theme";
  var STORAGE_CART = "zerno-cart";

  /* ---------- Утилиты ---------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
  }

  function plural(count, one, few, many) {
    var n = Math.abs(count) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  /* ---------- Данные меню ---------- */

  var MENU = [
    {
      id: "flat-white",
      name: "Флэт уайт",
      volume: "250 мл",
      desc: "Двойной эспрессо на зерне обжарки недели и плотное микропенное молоко. Плотный, сливочный, с карамельной сладостью.",
      price: 260,
      category: "classic",
      badge: "Хит гостей"
    },
    {
      id: "cappuccino",
      name: "Капучино",
      volume: "350 мл",
      desc: "Классическая пропорция эспрессо и молока: 1 к 2. Мягкая кремовая пенка и ореховое послевкусие бразильского зерна.",
      price: 250,
      category: "classic",
      badge: "Классика"
    },
    {
      id: "espresso",
      name: "Эспрессо",
      volume: "40 мл",
      desc: "Двойной шот на смеси Бразилия · Колумбия. Плотное тело, тёмный шоколад и лёгкая винная кислинка.",
      price: 190,
      category: "classic",
      badge: "Для бодрости"
    },
    {
      id: "raf-salted",
      name: "Раф «Солёная карамель»",
      volume: "350 мл",
      desc: "Сливки, эспрессо и домашняя солёная карамель на тростниковом сахаре. Тёплый, мягкий, с солёным акцентом.",
      price: 350,
      category: "author",
      badge: "Авторский"
    },
    {
      id: "latte-hazelnut",
      name: "Латте «Лесной орех»",
      volume: "450 мл",
      desc: "Эспрессо, молоко и сироп из обжаренного фундука. Воздушный напиток, в котором орех звучит без приторной сладости.",
      price: 370,
      category: "author",
      badge: "Новинка"
    },
    {
      id: "croissant",
      name: "Круассан на сливочном масле",
      volume: "120 г",
      desc: "Тридцать два слоя на французском масле 82%. Хрустящая карамельная корочка и воздушная середина.",
      price: 220,
      category: "bakery",
      badge: "Печём с 05:30"
    },
    {
      id: "cinnamon-bun",
      name: "Синнабон с корицей",
      volume: "140 г",
      desc: "Сдобное тесто со сливочным маслом, цейлонской корицей и крем-чизом на мягком творожном сыре.",
      price: 260,
      category: "bakery",
      badge: "Тёплый"
    },
    {
      id: "pear-tart",
      name: "Тарт с грушей и тимьяном",
      volume: "110 г",
      desc: "Песочная основа, миндальный крем без добавленного сахара и печёная груша с веточкой тимьяна.",
      price: 290,
      category: "bakery",
      badge: "Без сахара"
    }
  ];

  /* ---------- Корзина ---------- */

  var cart = [];

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_CART);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (item) {
          return item && typeof item.name === "string" && typeof item.price === "number" && item.qty > 0;
        })
        .map(function (item) {
          return {
            key: String(item.key || item.name),
            name: item.name,
            meta: String(item.meta || ""),
            price: Math.max(0, Math.round(item.price)),
            qty: Math.min(99, Math.max(1, Math.round(item.qty)))
          };
        });
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
    } catch (error) {}
  }

  function cartQuantity() {
    return cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function cartTotal() {
    return cart.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
  }

  function addToCart(name, meta, price, key) {
    var existing = cart.filter(function (item) {
      return item.key === key;
    })[0];

    if (existing) {
      existing.qty = Math.min(99, existing.qty + 1);
    } else {
      cart.push({ key: key, name: name, meta: meta, price: price, qty: 1 });
    }

    saveCart();
    renderCart(true);
    showToast(name, meta ? meta + " · " + formatPrice(price) : "Добавлено в заказ");
  }

  function changeQty(key, delta) {
    cart.forEach(function (item) {
      if (item.key === key) {
        item.qty += delta;
      }
    });

    cart = cart.filter(function (item) {
      return item.qty > 0;
    });

    saveCart();
    renderCart(false);
  }

  function removeFromCart(key) {
    cart = cart.filter(function (item) {
      return item.key !== key;
    });
    saveCart();
    renderCart(false);
  }

  function renderCart(animateCounter) {
    var list = $("#orderList");
    var badge = $("#orderBadge");
    var total = $("#orderTotal");
    var counter = $("#cartCount");
    var headerBtn = $("#headerOrderBtn");
    var quantity = cartQuantity();

    if (list) {
      if (!cart.length) {
        list.innerHTML =
          '<div class="order-empty">' +
          '<svg class="icon" width="26" height="26" aria-hidden="true"><use href="#i-bag"></use></svg>' +
          "<strong>Заказ пока пустой</strong>" +
          "<span>Добавьте кофе или выпечку из меню — здесь появится список и итоговая сумма.</span>" +
          "</div>";
      } else {
        list.innerHTML = cart
          .map(function (item) {
            return (
              '<div class="order-item">' +
              '<div class="order-item-main">' +
              '<div class="order-item-name">' +
              escapeHtml(item.name) +
              "</div>" +
              (item.meta ? '<div class="order-item-meta">' + escapeHtml(item.meta) + "</div>" : "") +
              "</div>" +
              '<div class="order-item-side">' +
              '<span class="order-item-price">' +
              formatPrice(item.price * item.qty) +
              "</span>" +
              '<button class="order-remove" type="button" data-remove="' +
              escapeHtml(item.key) +
              '" aria-label="Удалить ' +
              escapeHtml(item.name) +
              '"><svg class="icon" width="14" height="14" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
              "</div>" +
              '<div class="order-item-controls">' +
              '<button class="qty-btn" type="button" data-qty="-1" data-key="' +
              escapeHtml(item.key) +
              '" aria-label="Уменьшить количество"><svg class="icon" width="12" height="12" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
              '<span class="qty-value">' +
              item.qty +
              "</span>" +
              '<button class="qty-btn" type="button" data-qty="1" data-key="' +
              escapeHtml(item.key) +
              '" aria-label="Увеличить количество"><svg class="icon" width="12" height="12" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }
    }

    if (badge) {
      badge.textContent = quantity + " " + plural(quantity, "позиция", "позиции", "позиций");
    }

    if (total) {
      total.textContent = formatPrice(cartTotal());
    }

    if (counter) {
      counter.textContent = quantity;
      if (animateCounter) {
        counter.classList.remove("is-bump");
        void counter.offsetWidth;
        counter.classList.add("is-bump");
      }
    }

    if (headerBtn) {
      headerBtn.setAttribute("aria-label", "Заказать с собой, позиций в заказе: " + quantity);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------- Уведомления ---------- */

  function showToast(title, text) {
    var stack = $("#toastStack");
    if (!stack) return;

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<span class="toast-icon"><svg class="icon" width="14" height="14" aria-hidden="true"><use href="#i-check"></use></svg></span>' +
      '<span class="toast-text"><strong>' +
      escapeHtml(title) +
      "</strong><span>" +
      escapeHtml(text) +
      "</span></span>";

    stack.appendChild(toast);

    while (stack.children.length > 3) {
      stack.removeChild(stack.firstElementChild);
    }

    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 3400);
  }

  /* ---------- Рендер меню ---------- */

  var currentFilter = "all";

  function menuCardTemplate(item) {
    return (
      '<article class="menu-card reveal" data-cat="' +
      item.category +
      '">' +
      '<span class="card-badge">' +
      escapeHtml(item.badge) +
      "</span>" +
      '<h3 class="card-title">' +
      escapeHtml(item.name) +
      "</h3>" +
      '<span class="card-volume">' +
      escapeHtml(item.volume) +
      "</span>" +
      '<p class="card-desc">' +
      escapeHtml(item.desc) +
      "</p>" +
      '<div class="card-foot">' +
      '<span class="card-price">' +
      item.price +
      "<small> ₽</small></span>" +
      '<button class="add-btn" type="button" data-add="' +
      item.id +
      '">' +
      '<svg class="icon" width="14" height="14" aria-hidden="true"><use href="#i-plus"></use></svg>' +
      "Добавить в заказ</button>" +
      "</div>" +
      "</article>"
    );
  }

  function renderMenu(filter) {
    var grid = $("#menuGrid");
    if (!grid) return;

    currentFilter = filter || "all";

    var items = MENU.filter(function (item) {
      return currentFilter === "all" || item.category === currentFilter;
    });

    grid.innerHTML = items.map(menuCardTemplate).join("");

    if (window.__observeReveal) {
      window.__observeReveal($$(".menu-card", grid));
    }
  }

  function bindMenu() {
    var grid = $("#menuGrid");
    var filters = $("#menuFilters");

    if (grid) {
      grid.addEventListener("click", function (event) {
        var button = event.target.closest("[data-add]");
        if (!button) return;

        var id = button.getAttribute("data-add");
        var item = MENU.filter(function (entry) {
          return entry.id === id;
        })[0];
        if (!item) return;

        addToCart(item.name, item.volume, item.price, "menu:" + item.id);

        button.classList.add("is-added");
        var label = button.innerHTML;
        button.innerHTML =
          '<svg class="icon" width="14" height="14" aria-hidden="true"><use href="#i-check"></use></svg>В заказе';
        setTimeout(function () {
          button.classList.remove("is-added");
          button.innerHTML = label;
        }, 1400);
      });
    }

    if (filters) {
      filters.addEventListener("click", function (event) {
        var button = event.target.closest("[data-filter]");
        if (!button) return;

        $$(".filter-btn", filters).forEach(function (btn) {
          var active = btn === button;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-pressed", active ? "true" : "false");
        });

        renderMenu(button.getAttribute("data-filter"));
      });
    }

    var list = $("#orderList");
    if (list) {
      list.addEventListener("click", function (event) {
        var qtyButton = event.target.closest("[data-qty]");
        if (qtyButton) {
          changeQty(qtyButton.getAttribute("data-key"), Number(qtyButton.getAttribute("data-qty")));
          return;
        }

        var removeButton = event.target.closest("[data-remove]");
        if (removeButton) {
          removeFromCart(removeButton.getAttribute("data-remove"));
          showToast("Позиция удалена", "Заказ обновлён");
        }
      });
    }
  }

  /* ---------- Тема ---------- */

  function applyTheme(theme, persist) {
    var value = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", value);

    var meta = $("#metaThemeColor");
    if (meta) meta.setAttribute("content", value === "light" ? "#FAF6F0" : "#14100E");

    var button = $("#themeToggle");
    if (button) {
      var label = value === "dark" ? "Включить светлую тему" : "Включить тёмную тему";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }

    if (persist) {
      try {
        localStorage.setItem(STORAGE_THEME, value);
      } catch (error) {}
    }
  }

  function initTheme() {
    var button = $("#themeToggle");
    var current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "light" ? "light" : "dark", false);

    if (button) {
      button.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(next, true);
      });
    }
  }

  /* ---------- Мобильное меню ---------- */

  function initMobileMenu() {
    var toggle = $("#menuToggle");
    var menu = $("#mobileMenu");
    var overlay = $("#mobileOverlay");
    var closeButton = $("#menuClose");

    if (!toggle || !menu) return;

    function openMenu() {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      if (overlay) overlay.classList.add("is-visible");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Закрыть меню");
      document.body.classList.add("is-locked");
      if (closeButton) closeButton.focus();
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      if (overlay) overlay.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Открыть меню");
      document.body.classList.remove("is-locked");
    }

    function isOpen() {
      return menu.classList.contains("is-open");
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) closeMenu();
      else openMenu();
    });

    if (closeButton) closeButton.addEventListener("click", closeMenu);
    if (overlay) overlay.addEventListener("click", closeMenu);

    $$("a", menu).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024 && isOpen()) closeMenu();
    });
  }

  /* ---------- Шапка при скролле ---------- */

  function initHeaderScroll() {
    var header = $("#siteHeader");
    if (!header) return;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Конструктор напитка ---------- */

  var BASIS_PRICES = { espresso: 190, cappuccino: 250, latte: 270, raf: 300 };
  var VOLUME_PRICES = { "250": 0, "350": 50, "450": 100 };
  var BASIS_NAMES = { espresso: "Эспрессо", cappuccino: "Капучино", latte: "Латте", raf: "Раф" };
  var MILK_NAMES = { regular: "Обычное", oat: "Овсяное", coconut: "Кокосовое", almond: "Миндальное" };
  var SYRUP_NAMES = { none: "Без сиропа", salted: "Солёная карамель", vanilla: "Ваниль", hazelnut: "Лесной орех" };

  function checkedValue(form, name) {
    var input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : "";
  }

  function initBuilder() {
    var form = $("#builderForm");
    if (!form) return;

    var titleEl = $("#builderTitle");
    var basisEl = $("#sumBasis");
    var volumeEl = $("#sumVolume");
    var milkEl = $("#sumMilk");
    var syrupEl = $("#sumSyrup");
    var priceEl = $("#builderPrice");
    var addButton = $("#builderAdd");

    var current = { basis: "latte", volume: "350", milk: "regular", syrup: "none", price: 0 };

    function update() {
      current.basis = checkedValue(form, "basis") || "latte";
      current.volume = checkedValue(form, "volume") || "350";
      current.milk = checkedValue(form, "milk") || "regular";
      current.syrup = checkedValue(form, "syrup") || "none";

      current.price =
        (BASIS_PRICES[current.basis] || 0) +
        (VOLUME_PRICES[current.volume] || 0) +
        (function () {
          var milkInput = form.querySelector('input[name="milk"]:checked');
          var syrupInput = form.querySelector('input[name="syrup"]:checked');
          var milkExtra = milkInput ? Number(milkInput.getAttribute("data-price") || 0) : 0;
          var syrupExtra = syrupInput ? Number(syrupInput.getAttribute("data-price") || 0) : 0;
          return milkExtra + syrupExtra;
        })();

      if (titleEl) titleEl.textContent = BASIS_NAMES[current.basis] + " · " + current.volume + " мл";
      if (basisEl) basisEl.textContent = BASIS_NAMES[current.basis];
      if (volumeEl) volumeEl.textContent = current.volume + " мл";
      if (milkEl) milkEl.textContent = MILK_NAMES[current.milk];
      if (syrupEl) syrupEl.textContent = SYRUP_NAMES[current.syrup];
      if (priceEl) priceEl.textContent = formatPrice(current.price);
    }

    form.addEventListener("change", update);
    update();

    if (addButton) {
      addButton.addEventListener("click", function () {
        var name = BASIS_NAMES[current.basis] + " · " + current.volume + " мл";
        var meta = MILK_NAMES[current.milk] + " молоко · " + SYRUP_NAMES[current.syrup];
        var key = "builder:" + [current.basis, current.volume, current.milk, current.syrup].join("-");

        addToCart(name, meta, current.price, key);
      });
    }
  }

  /* ---------- FAQ ---------- */

  function initFaq() {
    var items = $$(".faq-item");
    if (!items.length) return;

    items.forEach(function (item) {
      var button = item.querySelector(".faq-q");
      var answer = item.querySelector(".faq-a");
      if (!button || !answer) return;

      button.addEventListener("click", function () {
        var willOpen = !item.classList.contains("is-open");

        items.forEach(function (other) {
          var otherButton = other.querySelector(".faq-q");
          var otherAnswer = other.querySelector(".faq-a");
          other.classList.remove("is-open");
          if (otherButton) otherButton.setAttribute("aria-expanded", "false");
          if (otherAnswer) otherAnswer.setAttribute("aria-hidden", "true");
        });

        if (willOpen) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
          answer.setAttribute("aria-hidden", "false");
        }
      });
    });
  }

  /* ---------- Маска и валидация телефона ---------- */

  function formatPhone(value) {
    var digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.charAt(0) === "8") digits = "7" + digits.slice(1);
    if (digits.charAt(0) !== "7") digits = "7" + digits;
    digits = digits.slice(0, 11);

    var result = "+7";
    if (digits.length > 1) result += " (" + digits.slice(1, 4);
    if (digits.length >= 5) result += ") " + digits.slice(4, 7);
    if (digits.length >= 8) result += "-" + digits.slice(7, 9);
    if (digits.length >= 10) result += "-" + digits.slice(9, 11);
    return result;
  }

  function phoneDigits(value) {
    return String(value).replace(/\D/g, "");
  }

  function setFieldError(field, hasError) {
    if (!field) return;
    field.classList.toggle("has-error", hasError);
    var input = field.querySelector("input");
    if (input) input.setAttribute("aria-invalid", hasError ? "true" : "false");
  }

  function initForm() {
    var form = $("#orderForm");
    if (!form) return;

    var nameField = $("#nameField");
    var phoneField = $("#phoneField");
    var nameInput = $("#customerName");
    var phoneInput = $("#customerPhone");
    var success = $("#orderSuccess");
    var successText = $("#orderSuccessText");
    var submitButton = form.querySelector('button[type="submit"]');
    var defaultLabel = submitButton ? submitButton.innerHTML : "";
    var successTimer = null;

    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        phoneInput.value = formatPhone(phoneInput.value);
        if (phoneField) setFieldError(phoneField, false);
      });
      phoneInput.addEventListener("focus", function () {
        if (!phoneInput.value) phoneInput.value = "+7 (";
      });
      phoneInput.addEventListener("blur", function () {
        if (phoneDigits(phoneInput.value).length <= 1) phoneInput.value = "";
      });
    }

    if (nameInput) {
      nameInput.addEventListener("input", function () {
        if (nameField) setFieldError(nameField, false);
      });
    }

    function validate() {
      var nameValue = nameInput ? nameInput.value.trim() : "";
      var digits = phoneDigits(phoneInput ? phoneInput.value : "");
      var nameOk = nameValue.length >= 2 && /^[А-Яа-яЁёA-Za-z\s-]+$/.test(nameValue);
      var phoneOk = digits.length === 11;

      if (nameField) setFieldError(nameField, !nameOk);
      if (phoneField) setFieldError(phoneField, !phoneOk);

      return nameOk && phoneOk;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!cart.length) {
        showToast("Заказ пустой", "Сначала добавьте кофе или выпечку из меню");
        var menuSection = $("#menu");
        if (menuSection) menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (!validate()) {
        var firstError = form.querySelector(".field.has-error input");
        if (firstError) firstError.focus();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = "Отправляем…";
      }

      window.setTimeout(function () {
        var orderNumber = 1000 + Math.floor(Math.random() * 900);

        if (successText) {
          successText.textContent =
            "Заказ №" + orderNumber + " принят. Перезвоним в течение 10 минут и подтвердим время.";
        }
        if (success) {
          success.classList.add("is-visible");
        }

        cart = [];
        saveCart();
        renderCart(false);
        form.reset();

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = defaultLabel;
        }

        showToast("Предзаказ оформлен", "Ждём вас на Покровке, 18");

        if (successTimer) window.clearTimeout(successTimer);
        successTimer = window.setTimeout(function () {
          if (success) success.classList.remove("is-visible");
        }, 9000);
      }, 700);
    });
  }

  /* ---------- Появление блоков ---------- */

  var revealObserver = null;

  function observeReveal(nodes) {
    var list = nodes && nodes.length ? nodes : $$(".reveal");
    if (!list.length) return;

    if (!("IntersectionObserver" in window)) {
      list.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
    }

    list.forEach(function (node) {
      if (node.getAttribute("data-reveal") === "1") return;
      node.setAttribute("data-reveal", "1");
      revealObserver.observe(node);
    });
  }

  window.__observeReveal = observeReveal;

  /* ---------- Статус «открыто / закрыто» ---------- */

  function initOpenStatus() {
    var wrapper = $("#openStatus");
    var text = $("#openStatusText");
    if (!wrapper || !text) return;

    function moscowMinutes() {
      try {
        var parts = new Intl.DateTimeFormat("ru-RU", {
          timeZone: "Europe/Moscow",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).formatToParts(new Date());
        var hours = 0;
        var minutes = 0;
        parts.forEach(function (part) {
          if (part.type === "hour") hours = Number(part.value);
          if (part.type === "minute") minutes = Number(part.value);
        });
        return hours * 60 + minutes;
      } catch (error) {
        var now = new Date();
        return now.getHours() * 60 + now.getMinutes();
      }
    }

    function update() {
      var minutes = moscowMinutes();
      var open = minutes >= 7 * 60 + 30 && minutes < 22 * 60;
      wrapper.classList.toggle("is-closed", !open);
      text.textContent = open ? "Сейчас открыто" : "Закрыто · откроемся в 07:30";
      wrapper.setAttribute("title", open ? "Кофейня открыта" : "Кофейня закрыта");
    }

    update();
    window.setInterval(update, 60000);
  }

  /* ---------- Инициализация ---------- */

  function init() {
    initTheme();
    initMobileMenu();
    initHeaderScroll();
    bindMenu();
    renderMenu("all");
    renderCart(false);
    initBuilder();
    initFaq();
    initForm();
    initOpenStatus();

    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    observeReveal();

    $$('.faq-item').forEach(function (item) {
      var button = item.querySelector(".faq-q");
      var answer = item.querySelector(".faq-a");
      if (!button || !answer) return;
      var open = item.classList.contains("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      answer.setAttribute("aria-hidden", open ? "false" : "true");
    });

    window.setTimeout(function () {
      observeReveal($$(".menu-card"));
    }, 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();