async function fetchCart(username) {
    try {
        const response = await fetch(`http://localhost:3000/get-cart/${username}`);
        const cartItems = await response.json();
        const list = document.getElementById("cartList");
        const footer = document.getElementById("cartFooter");
        const totalEl = document.getElementById("cartTotal");

        if (cartItems.length === 0) {
            list.innerHTML = `<p class="stat-desc">Vaša korpa je trenutno prazna. Pronađite nešto na <a href="index.html">početnoj</a>!</p>`;
            footer.style.display = "none";
            return;
        }

        footer.style.display = "block";
        let total = 0;

        list.innerHTML = cartItems.map((item) => {
            total += parseInt(item.price);
            return `
                <li class="cart-item">
                    <div class="cart-info">
                        <img src="backend/${item.imagePath}" class="cart-img" alt="">
                        <div>
                            <div style="font-weight: bold;">${item.name}</div>
                            <div style="font-size: 0.8rem; color: #888;">${item.category}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span>${item.price} RSD</span>
                        <button class="remove-item" onclick="removeFromCart('${item.cartItemId}')">✕</button>
                    </div>
                </li>`;
        }).join("");

        totalEl.innerText = `${total} RSD`;
    } catch (err) {
        console.error("Greška pri učitavanju korpe.");
    }
}

async function removeFromCart(cartItemId) {
    const user = sessionStorage.getItem("loggedInUser");
    try {
        const response = await fetch(`http://localhost:3000/remove-from-cart`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, cartItemId: cartItemId }),
        });
        if (response.ok) fetchCart(user);
    } catch (err) {
        console.error("Greška pri brisanju stavke.");
    }
}

async function processCheckout() {
    const user = sessionStorage.getItem("loggedInUser");
    try {
        const response = await fetch("http://localhost:3000/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user }),
        });
        if (response.ok) {
            fetchCart(user);
            fetchUserOrders(user);
        }
    } catch (err) {
        console.error("Greška pri kupovini.");
    }
}


/**
 * Funkcija za dobavljanje svih porudžbina iz baze (Admin uvid)
 */
async function fetchAdminOrders() {
    try {
        // Pozivamo backend rutu koja vraća apsolutno sve porudžbine iz baze
        const response = await fetch("http://localhost:3000/admin/orders");
        const orders = await response.json();
        
        const container = document.getElementById("adminOrdersList");
        if (!container) return;

        // Provera da li uopšte ima porudžbina
        if (orders.length === 0) {
            container.innerHTML = `<p class="stat-desc">Trenutno nema nijedne porudžbine u sistemu.</p>`;
            return;
        }

        // Sortiramo porudžbine tako da najnovije budu na vrhu
        // (Pretpostavljamo da je order.date u formatu koji se može porediti ili koristimo ID)
        const sortedOrders = orders.reverse();

        container.innerHTML = sortedOrders.map(order => {
            // Generisanje liste stavki unutar porudžbine
            const itemsHtml = order.items.map(i => `
                <div class="order-sub-item">
                    <span>• ${i.name}</span>
                    <span>${i.price} RSD</span>
                </div>
            `).join("");

            // Vraćamo HTML strukturu za svaku porudžbinu, uključujući informacije o korisniku, datumu, stavkama i ukupnoj ceni
            return `
                <div class="order-item admin-view">
                    <div class="order-header">
                        <div>
                            <strong>👤 Korisnik: ${order.customer}</strong>
                            <p style="font-size: 0.8rem; color: #888; margin: 0;">📅 Datum: ${order.date}</p>
                        </div>
                        <span class="order-id-badge">ID: ${order.orderId.slice(-6).toUpperCase()}</span>
                    </div>
                    <div class="order-details">
                        ${itemsHtml}
                    </div>
                    <div class="order-footer" style="margin-top: 10px; border-top: 1px dashed #eee; pt: 10px;">
                        <strong>Ukupan iznos: <span style="color: var(--secondary-color);">${order.total} RSD</span></strong>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Greška pri učitavanju svih porudžbina:", err);
        const container = document.getElementById("adminOrdersList");
        if (container) {
            container.innerHTML = `<p style="color:red;">Neuspešno povezivanje sa serverom pri učitavanju porudžbina.</p>`;
        }
    }
}

async function fetchUserOrders(username) {
    try {
        const response = await fetch(`http://localhost:3000/get-orders/${username}`);
        const orders = await response.json();
        const container = document.getElementById("userOrdersList");

        if (orders.length === 0) {
            container.innerHTML = `<p class="stat-desc">Još uvek nemate završenih porudžbina.</p>`;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span>📅 ${order.date}</span>
                    <strong>ID: ${order.orderId.slice(-6)}</strong>
                </div>
                <div class="order-details">
                    ${order.items.map(i => `• ${i.name} (${i.price} RSD)`).join("<br>")}
                </div>
                <div class="order-total">Ukupno: ${order.total} RSD</div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Greška pri učitavanju porudžbina.");
    }
}