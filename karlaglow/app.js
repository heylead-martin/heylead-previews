(function () {
  var BGN = 1.95583;
  var ECONT_SHOP = "8663702";
  var ECONT_FORM = "https://delivery.econt.com/customer_info.php";
  var ECONT_OFFICES = "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json";
  var CART_KEY = "kg_preview_cart";
  var ORDER_KEY = "kg_preview_last_order";

  var MODELS = [
    { group: "iPhone 17 серия", items: [
      ["iphone-17-pro-max", "iPhone 17 Pro Max"],
      ["iphone-17-pro", "iPhone 17 Pro"],
      ["iphone-17", "iPhone 17"]
    ]},
    { group: "iPhone 16 серия", items: [
      ["iphone-16-pro-max", "iPhone 16 Pro Max"],
      ["iphone-16-pro", "iPhone 16 Pro"],
      ["iphone-16", "iPhone 16"],
      ["iphone-16e", "iPhone 16e"]
    ]},
    { group: "iPhone 15 серия", items: [
      ["iphone-15-pro-max", "iPhone 15 Pro Max"],
      ["iphone-15-pro", "iPhone 15 Pro"],
      ["iphone-15", "iPhone 15"]
    ]},
    { group: "iPhone 14 серия", items: [
      ["iphone-14-pro", "iPhone 14 Pro"],
      ["iphone-14", "iPhone 14"],
      ["iphone-14-max", "iPhone 14 Max"]
    ]},
    { group: "iPhone 13 серия", items: [
      ["iphone-13-pro-max", "iPhone 13 Pro Max"],
      ["iphone-13-pro", "iPhone 13 Pro"],
      ["iphone-13", "iPhone 13"]
    ]},
    { group: "iPhone 12", items: [["iphone-12", "iPhone 12"]] }
  ];

  var catalog = { products: [] };
  var econtChoice = null;
  var econtRaw = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function dash(s) {
    return String(s || "").replace(/[\u2013\u2014]/g, "-");
  }
  function money(n) {
    var v = Number(n) || 0;
    return v.toFixed(2) + " € / " + (v * BGN).toFixed(2) + " лв.";
  }
  function cart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCartCount();
  }
  function cartTotal(items) {
    return (items || cart()).reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }
  function cartWeight(items) {
    return (items || cart()).reduce(function (s, i) {
      return s + (i.kind === "accessory" ? 0.1 : 0.3) * i.qty;
    }, 0) || 0.3;
  }
  function renderCartCount() {
    var n = cart().reduce(function (s, i) { return s + i.qty; }, 0);
    var el = $("cart-count");
    if (el) el.textContent = String(n);
  }

  function findProduct(key) {
    key = decodeURIComponent(key || "");
    return catalog.products.find(function (p) {
      return String(p.id) === key || p.key === key || p.slug === key;
    });
  }
  function modelsFor(p) {
    if (!p || p.kind === "accessory") return [];
    var name = (p.name || "").toLowerCase();
    var swar = (p.categorySlug || "").indexOf("swarovski") !== -1;
    return MODELS.map(function (g) {
      var items = g.items.filter(function (it) {
        if (name.indexOf("orange swarovski") !== -1) {
          return it[0] === "iphone-17-pro" || it[0] === "iphone-17-pro-max";
        }
        if (swar && g.group === "iPhone 12") return false;
        return true;
      });
      return { group: g.group, items: items };
    }).filter(function (g) { return g.items.length; });
  }

  function hashParts() {
    var h = (location.hash || "#/").replace(/^#/, "");
    return h.split("/").filter(Boolean);
  }

  function priceHtml(p) {
    var sale = p.regularPrice && p.regularPrice > p.price;
    return '<div class="price">' +
      (sale ? "<s>" + p.regularPrice.toFixed(2) + " €</s>" : "") +
      money(p.price) +
      "</div>";
  }

  function productCard(p) {
    var sale = p.regularPrice && p.regularPrice > p.price;
    return '<a class="card" href="#/p/' + esc(p.key || p.id) + '" data-link>' +
      '<img src="' + esc(p.image) + '" alt="">' +
      '<div class="card-body">' +
      '<div class="card-cat">' + esc(dash(p.category)) + "</div>" +
      "<h3>" + esc(dash(p.name)) + "</h3>" +
      (sale ? '<span class="badge">SALE</span>' : "") +
      priceHtml(p) +
      "</div></a>";
  }

  function renderShop(cat) {
    var list = catalog.products;
    if (cat) list = list.filter(function (p) { return p.categorySlug === cat; });
    var title = "Калъфи за iPhone";
    if (cat === "swarovski-cases") title = "Swarovski";
    if (cat === "apple-cases") title = "Apple Cases";
    if (cat === "brand-cases") title = "Brand Cases";
    if (cat === "accessories") title = "Аксесоари";
    var hero = "";
    if (!cat) {
      var pics = catalog.products.filter(function (p) { return (p.categorySlug || "").indexOf("swarovski") !== -1; }).slice(0, 3);
      hero = '<section class="hero container">' +
        "<div><h1>Блясък за iPhone. <em>Доставка с Еконт</em>, без плъгина.</h1>" +
        "<p>Това е тестов магазин. Избери калъф, после виж как Еконт калкулира офис, еконтомат или адрес и връща реална цена за KarlaGlow.</p>" +
        '<a class="btn btn-accent" href="#/c/swarovski-cases" data-link>Swarovski колекция</a></div>' +
        '<div class="hero-art">' + pics.map(function (p) { return '<img src="' + esc(p.image) + '" alt="">'; }).join("") + "</div>" +
        "</section>";
    }
    $("app").innerHTML = hero +
      '<section class="container"><h2 class="section-title">' + esc(title) + "</h2>" +
      '<div class="grid">' + list.map(productCard).join("") + "</div></section>";
  }

  function renderProduct(key) {
    var p = findProduct(key);
    if (!p) { renderShop(); return; }
    var models = modelsFor(p);
    var imgs = (p.images && p.images.length ? p.images : [p.image]);
    var sale = p.regularPrice && p.regularPrice > p.price;
    var modelSelect = "";
    if (models.length) {
      modelSelect = '<div class="field"><label>Избери модел iPhone</label><select id="device"><option value="">Избери модел</option>' +
        models.map(function (g) {
          return '<optgroup label="' + esc(g.group) + '">' +
            g.items.map(function (it) { return '<option value="' + esc(it[0]) + '">' + esc(it[1]) + "</option>"; }).join("") +
            "</optgroup>";
        }).join("") + '</select><div class="err" id="device-err"></div></div>';
    }
    $("app").innerHTML =
      '<article class="product container">' +
      '<div><div class="gallery-main"><img id="main-img" src="' + esc(imgs[0]) + '" alt=""></div>' +
      (imgs.length > 1 ? '<div class="thumbs">' + imgs.map(function (src, i) {
        return '<button type="button" class="' + (i === 0 ? "on" : "") + '" data-src="' + esc(src) + '"><img src="' + esc(src) + '" alt=""></button>';
      }).join("") + "</div>" : "") +
      "</div><div>" +
      (sale ? '<span class="badge">-' + Math.round((1 - p.price / p.regularPrice) * 100) + "%</span>" : "") +
      "<h1>" + esc(dash(p.name)) + "</h1>" +
      priceHtml(p) +
      "<p class='muted'>" + esc(dash(p.short || "Ръчно избран калъф за iPhone. Наложен платеж с Еконт.")) + "</p>" +
      modelSelect +
      '<div class="actions">' +
      '<button class="btn" id="add-cart">Добави в количката</button>' +
      '<button class="btn btn-accent" id="buy-now">Купи сега</button>' +
      "</div></div></article>";

    document.querySelectorAll(".thumbs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".thumbs button").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        $("main-img").src = btn.getAttribute("data-src");
      });
    });

    function chosen() {
      var sel = $("device");
      if (!sel) return { ok: true, device: "", label: "" };
      if (!sel.value) {
        $("device-err").textContent = "Избери модел iPhone, за да продължиш.";
        return { ok: false };
      }
      $("device-err").textContent = "";
      return { ok: true, device: sel.value, label: sel.options[sel.selectedIndex].text };
    }
    function lineFromChoice(ch) {
      return {
        id: p.id,
        key: p.key,
        name: p.name,
        image: p.image,
        price: p.price,
        qty: 1,
        kind: p.kind,
        device: ch.device,
        deviceLabel: ch.label
      };
    }
    $("add-cart").onclick = function () {
      var ch = chosen();
      if (!ch.ok) return;
      var items = cart();
      items.push(lineFromChoice(ch));
      setCart(items);
      $("add-cart").textContent = "Добавено";
    };
    $("buy-now").onclick = function () {
      var ch = chosen();
      if (!ch.ok) return;
      setCart([lineFromChoice(ch)]);
      location.hash = "#/checkout";
    };
  }

  function econtUrl(items) {
    var params = new URLSearchParams({
      id_shop: ECONT_SHOP,
      order_total: cartTotal(items).toFixed(2),
      order_currency: "EUR",
      order_weight: cartWeight(items).toFixed(3),
      ignore_history: "1",
      confirm_txt: "Потвърди доставката"
    });
    return ECONT_FORM + "?" + params.toString();
  }

  function renderCheckout() {
    var items = cart();
    if (!items.length) {
      $("app").innerHTML = '<div class="container thanks"><h1>Количката е празна</h1><p><a class="btn" href="#/" data-link>Към магазина</a></p></div>';
      return;
    }
    var lines = items.map(function (i) {
      return '<div class="cart-item"><img src="' + esc(i.image) + '" alt=""><div><strong>' + esc(dash(i.name)) + "</strong><div class='muted'>" +
        esc(i.deviceLabel || "") + (i.qty > 1 ? " · x" + i.qty : "") +
        "</div></div><div>" + money(i.price * i.qty) + "</div></div>";
    }).join("");

    $("app").innerHTML =
      '<div class="checkout container">' +
      '<div><div class="panel"><h2>Доставка с Еконт</h2>' +
      '<div class="note">Име, телефон и адрес се попълват в формата на Еконт. Избираш офис, еконтомат или адрес, те връщат точната цена.</div>' +
      '<div id="econt-box">' +
      (econtChoice ? econtSummaryHtml() : '<div class="econt-frame-wrap"><iframe id="econt-frame" title="Еконт доставка" allow="geolocation" src="about:blank"></iframe></div>') +
      "</div>" +
      '<div class="err" id="econt-err"></div>' +
      "</div></div>" +
      '<aside class="panel"><h2>Поръчка</h2>' + lines +
      '<div class="summary-line"><span>Продукти</span><span>' + money(cartTotal(items)) + "</span></div>" +
      '<div class="summary-line"><span>Доставка Еконт</span><span id="ship-line">' + (econtChoice ? money(econtChoice.shipping) : "избери в формата") + "</span></div>" +
      '<div class="summary-line summary-total"><span>За плащане при доставка</span><span id="grand">' +
      money(cartTotal(items) + (econtChoice ? econtChoice.shipping : 0)) + "</span></div>" +
      '<p class="muted">Наложен платеж. Плащаш на куриера.</p>' +
      '<button class="btn btn-accent" id="place" style="width:100%;margin-top:8px"' + (econtChoice ? "" : " disabled") + ">Поръчай</button>" +
      '<div class="err" id="place-err"></div>' +
      "</aside></div>";

    bindCheckout(items);
  }

  function econtSummaryHtml() {
    var c = econtChoice;
    return '<div class="econt-summary"><h3>Еконт потвърди доставката</h3>' +
      "<p><strong>" + esc(c.name || c.label) + "</strong>" + (c.phone ? " · " + esc(c.phone) : "") + "</p>" +
      "<p>" + esc(c.label) + "</p>" +
      "<p>" + esc(c.destination) + "</p>" +
      "<p>Цена с наложен платеж: <strong>" + money(c.shipping) + "</strong> " + esc(c.currency || "EUR") + "</p>" +
      '<button class="btn btn-ghost" type="button" id="econt-change">Промени адреса</button>' +
      '<details><summary class="muted">Данни, върнати от Еконт</summary><pre class="payload">' + esc(JSON.stringify(econtRaw, null, 2)) + "</pre></details>" +
      "</div>";
  }

  function loadFrame(items) {
    var frame = $("econt-frame");
    if (!frame) return;
    frame.src = econtUrl(items);
  }

  function bindCheckout(items) {
    if (!econtChoice) loadFrame(items);
    var change = $("econt-change");
    if (change) {
      change.onclick = function () {
        econtChoice = null;
        econtRaw = null;
        renderCheckout();
      };
    }
    $("place").onclick = function () {
      if (!econtChoice) {
        $("place-err").textContent = "Първо потвърди доставката в формата на Еконт.";
        return;
      }
      var order = {
        id: "KG-" + Date.now().toString(36).toUpperCase(),
        at: new Date().toISOString(),
        customer: {
          name: econtChoice.name || "",
          phone: econtChoice.phone || "",
          email: econtChoice.email || ""
        },
        items: items,
        econt: econtChoice,
        products: cartTotal(items),
        shipping: econtChoice.shipping,
        total: cartTotal(items) + econtChoice.shipping
      };
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      setCart([]);
      location.hash = "#/thanks/" + order.id;
    };
  }

  function onEcontMessage(event) {
    if (!event.origin || event.origin.indexOf("delivery.econt.com") === -1) return;
    var data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.shipment_error) {
      var err = $("econt-err");
      if (err) err.textContent = String(data.shipment_error);
      return;
    }
    if (!data.id && data.shipping_price == null && data.shipping_price_cod == null) return;
    econtRaw = data;
    var ship = Number(data.shipping_price_cod != null ? data.shipping_price_cod : data.shipping_price) || 0;
    var office = data.office_code || data.officeCode || "";
    var dest = [data.city_name || data.cityName, data.address, office ? "офис " + office : ""]
      .filter(Boolean).join(", ");
    econtChoice = {
      id: data.id || "",
      shipping: ship,
      currency: data.shipping_price_currency || "EUR",
      officeCode: office,
      city: data.city_name || "",
      address: data.address || "",
      destination: dest || "Еконт доставка",
      label: office ? "До офис / еконтомат на Еконт" : "До адрес с Еконт",
      name: data.name || data.face || "",
      phone: data.phone || "",
      email: data.email || ""
    };
    if (location.hash.indexOf("checkout") !== -1) renderCheckout();
  }

  function renderThanks(id) {
    var order = null;
    try { order = JSON.parse(localStorage.getItem(ORDER_KEY) || "null"); } catch (e) {}
    if (!order || (id && order.id !== id)) {
      $("app").innerHTML = '<div class="container thanks"><h1>Няма такава поръчка</h1><a class="btn" href="#/" data-link>Начало</a></div>';
      return;
    }
    $("app").innerHTML =
      '<div class="container thanks"><h1>Готово</h1>' +
      "<p>Поръчка <strong>" + esc(order.id) + "</strong> е записана в този браузър.</p>" +
      "<p>" + esc(order.econt.label) + ": " + esc(order.econt.destination) + "</p>" +
      "<p>За плащане при доставка: <strong>" + money(order.total) + "</strong></p>" +
      '<div class="note" style="text-align:left;margin-top:18px">Това е прегледът. Еконт вече калкулира цената през тяхната форма. Следващата стъпка (когато кажеш) е да пратим поръчката с <code>OrdersService.updateOrder</code> и кода за свързване, без плъгина и без да пипаме admin.karlaglow.com преди да си видял потока.</div>' +
      '<p style="margin-top:18px"><a class="btn" href="#/" data-link>Нова поръчка</a></p>' +
      '<details style="text-align:left;margin-top:18px"><summary>Пълен запис</summary><pre class="payload">' + esc(JSON.stringify(order, null, 2)) + "</pre></details>" +
      "</div>";
  }

  function render() {
    var parts = hashParts();
    if (parts[0] === "p" && parts[1]) return renderProduct(parts[1]);
    if (parts[0] === "c" && parts[1]) return renderShop(parts[1]);
    if (parts[0] === "checkout") return renderCheckout();
    if (parts[0] === "thanks") return renderThanks(parts[1]);
    renderShop();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-link]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (href && href.charAt(0) === "#") {
      e.preventDefault();
      if (location.hash !== href) location.hash = href;
      else render();
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("message", onEcontMessage);

  function pingEcont() {
    var el = $("econt-ping");
    fetch(ECONT_OFFICES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: "BGR", cityID: 41 })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var off = d.offices || [];
      var aps = off.filter(function (o) { return o.isAPS; }).length;
      if (el) el.textContent = "· Еконт API: " + off.length + " офиса в София, " + aps + " еконтомата";
    }).catch(function () {
      if (el) el.textContent = "· Еконт API: формата за доставка е активна";
    });
  }

  fetch("data/products.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      catalog = data;
      renderCartCount();
      render();
      pingEcont();
    })
    .catch(function () {
      $("app").innerHTML = '<div class="container">Не можах да заредя продуктите.</div>';
    });
})();
