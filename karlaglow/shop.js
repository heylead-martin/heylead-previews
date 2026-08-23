(function () {
  var BGN = 1.95583;
  var ECONT_OFFICES = "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json";
  var ECONT_STREETS = "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getStreets.json";
  var CART_KEY = "kg_preview_cart";
  var ORDER_KEY = "kg_preview_last_order";
  var CHECKOUT_API = "https://admin.karlaglow.com/api/checkout/order";
  var SHIP_OFFICE = 4.12;
  var SHIP_ADDRESS = 5.32;

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
  var cities = [];
  var officesByCity = {};
  var streetsByCity = {};
  var pickedCity = null;
  var pickedOffice = null;
  var deliveryMode = "office";

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

  function shipCost() {
    return deliveryMode === "address" ? SHIP_ADDRESS : SHIP_OFFICE;
  }

  function officeAddress(o) {
    var a = (o && o.address) || {};
    return a.fullAddress || [a.street, a.num || a.streetNumber].filter(Boolean).join(" ") || "";
  }

  function filterCities(q) {
    q = (q || "").trim().toLowerCase();
    if (q.length < 1) return [];
    var out = [];
    for (var i = 0; i < cities.length && out.length < 12; i++) {
      var c = cities[i];
      var blob = ((c.name || "") + " " + (c.nameEn || "") + " " + (c.postCode || "")).toLowerCase();
      if (blob.indexOf(q) !== -1) out.push(c);
    }
    return out;
  }

  function renderSuggest(el, items, renderItem, onPick) {
    if (!el) return;
    if (!items.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = items.map(renderItem).join("");
    el.querySelectorAll("[data-pick]").forEach(function (btn) {
      btn.onclick = function () { onPick(btn); };
    });
  }

  function loadOffices(cityId) {
    if (officesByCity[cityId]) return Promise.resolve(officesByCity[cityId]);
    return fetch(ECONT_OFFICES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: "BGR", cityID: cityId })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d.offices || []).map(function (o) {
        return {
          id: o.id,
          code: o.code,
          name: o.name,
          isAPS: !!o.isAPS,
          isMPS: !!o.isMPS,
          address: officeAddress(o)
        };
      });
      officesByCity[cityId] = list;
      return list;
    });
  }

  function loadStreets(cityId) {
    if (streetsByCity[cityId]) return Promise.resolve(streetsByCity[cityId]);
    return fetch(ECONT_STREETS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityID: cityId })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d.streets || []).map(function (s) {
        return { id: s.id, name: s.name, nameEn: s.nameEn };
      });
      streetsByCity[cityId] = list;
      return list;
    });
  }

  function officesForMode() {
    if (!pickedCity) return [];
    var list = officesByCity[pickedCity.id] || [];
    if (deliveryMode === "locker") return list.filter(function (o) { return o.isAPS; });
    if (deliveryMode === "office") return list.filter(function (o) { return !o.isAPS; });
    return [];
  }

  function renderOfficeList(filter) {
    var box = $("office-list");
    if (!box) return;
    var list = officesForMode();
    var q = (filter || "").trim().toLowerCase();
    if (q) {
      list = list.filter(function (o) {
        return (o.name + " " + o.address + " " + o.code).toLowerCase().indexOf(q) !== -1;
      });
    }
    if (!pickedCity) {
      box.innerHTML = '<p class="muted">Първо избери населено място.</p>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<p class="muted">' + (deliveryMode === "locker" ? "Няма еконтомат в този град." : "Няма офис в този град.") + "</p>";
      return;
    }
    box.innerHTML = list.slice(0, 40).map(function (o) {
      var on = pickedOffice && pickedOffice.code === o.code ? " on" : "";
      return '<button type="button" class="office-item' + on + '" data-code="' + esc(o.code) + '">' +
        "<strong>" + esc(o.name) + "</strong>" +
        '<span class="muted">' + esc(o.address || ("код " + o.code)) + "</span></button>";
    }).join("");
    box.querySelectorAll(".office-item").forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.getAttribute("data-code");
        pickedOffice = officesForMode().find(function (o) { return o.code === code; }) || null;
        econtChoice = null;
        var host = $("econt-summary-host");
        if (host) host.innerHTML = "";
        renderOfficeList($("office-search") && $("office-search").value);
        refreshTotals();
      };
    });
  }

  function refreshTotals() {
    var shipping = null;
    if (deliveryMode === "address" && pickedCity) shipping = SHIP_ADDRESS;
    if ((deliveryMode === "office" || deliveryMode === "locker") && pickedOffice) shipping = SHIP_OFFICE;
    var ship = $("ship-line");
    var grand = $("grand");
    var place = $("place");
    var items = cart();
    if (ship) ship.textContent = shipping != null ? money(shipping) : "потвърди доставката";
    if (grand) grand.textContent = money(cartTotal(items) + (shipping || 0));
    if (place) place.disabled = !econtChoice;
  }

  function showModePanels() {
    var pickup = $("pickup-panel");
    var address = $("address-panel");
    if (pickup) pickup.hidden = deliveryMode === "address";
    if (address) address.hidden = deliveryMode !== "address";
    document.querySelectorAll('input[name="billing_delivery_mode"]').forEach(function (r) {
      r.checked = r.value === deliveryMode;
    });
    renderOfficeList($("office-search") && $("office-search").value);
    refreshTotals();
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
    var shipping = econtChoice ? econtChoice.shipping : null;

    $("app").innerHTML =
      '<div class="checkout container">' +
      '<div><div class="panel"><h2>Доставка с Еконт</h2>' +
      '<p class="note">Полетата са на KarlaGlow. Населените места и офисите се зареждат от Еконт API, без iframe и без плъгина.</p>' +
      '<div class="field"><label for="billing_name">Име и фамилия *</label>' +
      '<input id="billing_name" name="billing_name" autocomplete="name" required></div>' +
      '<div class="field"><label for="billing_company">Лице за контакт <span class="muted">(ако е фирма)</span></label>' +
      '<input id="billing_company" name="billing_company" autocomplete="organization"></div>' +
      '<div class="field"><label for="billing_phone">Телефон *</label>' +
      '<input id="billing_phone" name="billing_phone" autocomplete="tel" required></div>' +
      '<div class="field"><label for="billing_email">E-mail</label>' +
      '<input id="billing_email" name="billing_email" type="email" autocomplete="email"></div>' +
      '<div class="field"><label>Държава *</label>' +
      '<div class="static-field">България</div></div>' +
      '<div class="field suggest-wrap"><label for="billing_city">Населено място *</label>' +
      '<input id="billing_city" name="billing_city" autocomplete="off" placeholder="напр. София">' +
      '<div class="suggest" id="city-suggest" hidden></div></div>' +
      '<div class="radio-row" role="radiogroup" aria-label="Начин на доставка">' +
      '<label class="radio"><input type="radio" name="billing_delivery_mode" value="office" checked> До офис на Еконт</label>' +
      '<label class="radio"><input type="radio" name="billing_delivery_mode" value="address"> Адрес</label>' +
      '<label class="radio"><input type="radio" name="billing_delivery_mode" value="locker"> Еконтомат</label>' +
      "</div>" +
      '<div id="pickup-panel">' +
      '<div class="field"><label for="office-search">Търси офис</label>' +
      '<input id="office-search" autocomplete="off" placeholder="име, квартал, улица"></div>' +
      '<div class="office-list" id="office-list"><p class="muted">Избери град, за да заредим офисите от Еконт.</p></div>' +
      "</div>" +
      '<div id="address-panel" hidden>' +
      '<div class="field suggest-wrap"><label for="billing_address_1">Улица *</label>' +
      '<input id="billing_address_1" name="billing_address_1" autocomplete="off">' +
      '<div class="suggest" id="street-suggest" hidden></div></div>' +
      '<div class="row2"><div class="field"><label for="billing_street_number">Номер</label>' +
      '<input id="billing_street_number"></div>' +
      '<div class="field"><label for="billing_postcode">Пощенски код</label>' +
      '<input id="billing_postcode" autocomplete="postal-code"></div></div>' +
      '<div class="field"><label for="billing_address_2">Блок, вход, етаж</label>' +
      '<input id="billing_address_2"></div>' +
      "</div>" +
      '<button type="button" class="btn btn-confirm" id="confirm-delivery">Потвърди доставката</button>' +
      '<div class="err" id="econt-err"></div>' +
      '<div id="econt-summary-host"></div>' +
      "</div></div>" +
      '<aside class="panel"><h2>Поръчка</h2>' + lines +
      '<div class="summary-line"><span>Продукти</span><span>' + money(cartTotal(items)) + "</span></div>" +
      '<div class="summary-line"><span>Доставка Еконт</span><span id="ship-line">' + (shipping != null ? money(shipping) : "потвърди доставката") + "</span></div>" +
      '<div class="summary-line summary-total"><span>За плащане при доставка</span><span id="grand">' +
      money(cartTotal(items) + (shipping || 0)) + "</span></div>" +
      '<p class="muted">Наложен платеж. Плащаш на куриера.</p>' +
      '<button class="btn btn-accent" id="place" style="width:100%;margin-top:8px" disabled>Поръчай</button>' +
      '<div class="err" id="place-err"></div>' +
      "</aside></div>";

    bindCheckout(items);
  }

  function confirmDelivery() {
    var err = $("econt-err");
    var name = ($("billing_name") && $("billing_name").value.trim()) || "";
    var phone = ($("billing_phone") && $("billing_phone").value.trim()) || "";
    if (!name || !phone) {
      err.textContent = "Попълни име и телефон.";
      return;
    }
    if (!pickedCity) {
      err.textContent = "Избери населено място от списъка.";
      return;
    }
    if (deliveryMode !== "address" && !pickedOffice) {
      err.textContent = deliveryMode === "locker" ? "Избери еконтомат." : "Избери офис.";
      return;
    }
    if (deliveryMode === "address") {
      var street = ($("billing_address_1") && $("billing_address_1").value.trim()) || "";
      if (!street) {
        err.textContent = "Попълни улица.";
        return;
      }
    }
    err.textContent = "";
    var dest;
    var label;
    if (deliveryMode === "address") {
      dest = [
        $("billing_address_1").value.trim(),
        ($("billing_street_number") && $("billing_street_number").value.trim()) || "",
        pickedCity.name,
        ($("billing_postcode") && $("billing_postcode").value.trim()) || pickedCity.postCode || ""
      ].filter(Boolean).join(", ");
      label = "До адрес с Еконт";
    } else {
      dest = pickedOffice.name + (pickedOffice.address ? " - " + pickedOffice.address : "");
      label = deliveryMode === "locker" ? "До еконтомат" : "До офис на Еконт";
    }
    econtChoice = {
      name: name,
      face: ($("billing_company") && $("billing_company").value.trim()) || "",
      phone: phone,
      email: ($("billing_email") && $("billing_email").value.trim()) || "",
      city: pickedCity.name,
      cityId: pickedCity.id,
      postCode: (deliveryMode === "address" && $("billing_postcode") && $("billing_postcode").value.trim()) || pickedCity.postCode || "",
      officeCode: pickedOffice ? pickedOffice.code : "",
      officeName: pickedOffice ? pickedOffice.name : "",
      address: dest,
      destination: dest,
      label: label,
      mode: deliveryMode,
      shipping: shipCost(),
      currency: "EUR"
    };
    var host = $("econt-summary-host");
    if (host) {
      host.innerHTML = '<div class="econt-summary"><h3>' + esc(label) + "</h3><p>" + esc(dest) +
        "</p><p>Доставка: <strong>" + money(econtChoice.shipping) + "</strong></p></div>";
    }
    refreshTotals();
    var place = $("place");
    if (place) place.disabled = false;
  }

  function bindCheckout(items) {
    ensureCities().then(function () {
      if ($("billing_city") && pickedCity) $("billing_city").value = pickedCity.name;
    });

    document.querySelectorAll('input[name="billing_delivery_mode"]').forEach(function (r) {
      r.addEventListener("change", function () {
        deliveryMode = r.value;
        pickedOffice = null;
        econtChoice = null;
        var host = $("econt-summary-host");
        if (host) host.innerHTML = "";
        showModePanels();
        if (pickedCity && deliveryMode !== "address") {
          loadOffices(pickedCity.id).then(function () { renderOfficeList($("office-search") && $("office-search").value); });
        }
        if (pickedCity && deliveryMode === "address") {
          if ($("billing_postcode") && !$("billing_postcode").value) $("billing_postcode").value = pickedCity.postCode || "";
          loadStreets(pickedCity.id).catch(function () {});
        }
      });
    });

    var cityInput = $("billing_city");
    var citySuggest = $("city-suggest");
    if (cityInput) {
      cityInput.addEventListener("input", function () {
        pickedCity = null;
        pickedOffice = null;
        econtChoice = null;
        var sum = $("econt-summary-host");
        if (sum) sum.innerHTML = "";
        refreshTotals();
        renderSuggest(citySuggest, filterCities(cityInput.value), function (c) {
          return '<button type="button" data-pick data-id="' + c.id + '"><strong>' + esc(c.name) +
            "</strong> <span class='muted'>" + esc(c.postCode || "") + " · " + esc(c.region || "") + "</span></button>";
        }, function (btn) {
          var id = Number(btn.getAttribute("data-id"));
          pickedCity = cities.find(function (c) { return c.id === id; }) || null;
          if (pickedCity) {
            cityInput.value = pickedCity.name;
            if ($("billing_postcode")) $("billing_postcode").value = pickedCity.postCode || "";
          }
          citySuggest.hidden = true;
          if (pickedCity && deliveryMode !== "address") {
            $("office-list").innerHTML = '<p class="muted">Зареждаме офиси от Еконт…</p>';
            loadOffices(pickedCity.id).then(function () { renderOfficeList(""); }).catch(function () {
              $("office-list").innerHTML = '<p class="err">Не успяхме да заредим офисите.</p>';
            });
          }
          if (pickedCity && deliveryMode === "address") loadStreets(pickedCity.id).catch(function () {});
        });
      });
    }

    var officeSearch = $("office-search");
    if (officeSearch) officeSearch.addEventListener("input", function () { renderOfficeList(officeSearch.value); });

    var streetInput = $("billing_address_1");
    var streetSuggest = $("street-suggest");
    if (streetInput) {
      streetInput.addEventListener("input", function () {
        if (!pickedCity) return;
        loadStreets(pickedCity.id).then(function (list) {
          var q = streetInput.value.trim().toLowerCase();
          var hits = (list || []).filter(function (s) {
            return ((s.name || "") + " " + (s.nameEn || "")).toLowerCase().indexOf(q) !== -1;
          }).slice(0, 12);
          renderSuggest(streetSuggest, q.length ? hits : [], function (s) {
            return '<button type="button" data-pick data-name="' + esc(s.name) + '">' + esc(s.name) + "</button>";
          }, function (btn) {
            streetInput.value = btn.getAttribute("data-name") || "";
            streetSuggest.hidden = true;
          });
        }).catch(function () {});
      });
    }

    $("confirm-delivery").onclick = confirmDelivery;
    $("place").onclick = function () {
      if (!econtChoice) {
        $("place-err").textContent = "Първо потвърди доставката.";
        return;
      }
      var btn = $("place");
      var err = $("place-err");
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "Изпращаме…";
      err.textContent = "";
      var customer = {
        name: ($("billing_name") && $("billing_name").value.trim()) || econtChoice.name,
        phone: ($("billing_phone") && $("billing_phone").value.trim()) || econtChoice.phone,
        email: ($("billing_email") && $("billing_email").value.trim()) || econtChoice.email || ""
      };
      fetch(CHECKOUT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customer,
          items: items.map(function (i) {
            return {
              id: i.id,
              qty: i.qty,
              name: i.name,
              price: i.price,
              device: i.device,
              deviceLabel: i.deviceLabel
            };
          }),
          econt: econtChoice
        })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.ok) throw new Error((data && data.error) || "Неуспешна поръчка");
          return data;
        }, function () {
          throw new Error("Сървърът върна неочакван отговор.");
        });
      }).then(function (data) {
        var order = {
          id: String(data.orderId),
          at: new Date().toISOString(),
          customer: customer,
          items: items,
          econt: econtChoice,
          products: cartTotal(items),
          shipping: econtChoice.shipping,
          total: Number(data.total) || (cartTotal(items) + econtChoice.shipping),
          thanks: data.thanks || "",
          admin: data.admin || "",
          econtId: data.econtId || null
        };
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
        setCart([]);
        location.hash = "#/thanks/" + order.id;
      }).catch(function (e) {
        err.textContent = (e && e.message) || "Неуспешна поръчка. Опитай пак.";
        btn.disabled = false;
        btn.textContent = "Поръчай";
      });
    };
    showModePanels();
  }

  function ensureCities() {
    if (cities.length) return Promise.resolve(cities);
    return fetch("data/cities.json").then(function (r) { return r.json(); }).then(function (list) {
      cities = list || [];
      return cities;
    });
  }

  function renderThanks(id) {
    var order = null;
    try { order = JSON.parse(localStorage.getItem(ORDER_KEY) || "null"); } catch (e) {}
    if (!order || (id && order.id !== id)) {
      $("app").innerHTML = '<div class="container thanks"><h1>Няма такава поръчка</h1><a class="btn" href="#/" data-link>Начало</a></div>';
      return;
    }
    var thanksHref = order.thanks || ("https://karlaglow.com/checkout/order-received/" + encodeURIComponent(order.id) + "/");
    var adminHref = order.admin || ("https://karlaglow.com/wp-admin/admin.php?page=wc-orders&action=edit&id=" + encodeURIComponent(order.id));
    $("app").innerHTML =
      '<div class="container thanks"><h1>Готово</h1>' +
      "<p>Поръчка <strong>#" + esc(order.id) + "</strong> е в WooCommerce.</p>" +
      "<p>" + esc(order.econt.label) + ": " + esc(order.econt.destination) + "</p>" +
      "<p>За плащане при доставка: <strong>" + money(order.total) + "</strong></p>" +
      '<p style="margin-top:18px"><a class="btn btn-accent" href="' + esc(thanksHref) + '">Страница за благодарност</a></p>' +
      '<p><a href="' + esc(adminHref) + '">Отвори в wp-admin</a></p>' +
      '<p style="margin-top:18px"><a class="btn" href="#/" data-link>Нова поръчка</a></p>' +
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
      ensureCities();
    })
    .catch(function () {
      $("app").innerHTML = '<div class="container">Не можах да заредя продуктите.</div>';
    });
})();
