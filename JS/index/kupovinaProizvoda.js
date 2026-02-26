async function loadProducts() {
    // Preuzimanje niza proizvoda sa backend-a
    const response = await fetch('http://localhost:3000/products');
    const products = await response.json();
    const grid = document.querySelector('.grid'); // Mesto gde će se kartice ispisati
    
    // Provera sesije da bismo znali koja dugmad da prikažemo
    let user = sessionStorage.getItem('loggedInUser');
    
    if (products.length > 0) {
        // Mapiranje svakog proizvoda u HTML strukturu (karticu)
        grid.innerHTML = products.map(p => `
            <div class="item-card">
                <div class="item-tag">${p.category}</div>
                <div style="width: 100%; height: 300px; display: flex; justify-content: center; align-items: center; overflow: hidden;">
                    <img class="item-img" src="backend${p.imagePath}" alt="${p.name}">
                </div>
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                
                ${user == null 
                    ? `<p class="login-notice">Morate biti prijavljeni da biste dodali proizvod u korpu</p>` 
                    : `<div class="item-footer">
                        <span class="price">${p.price} RSD</span>
                        ${user == "admin" 
                            ? `<button class="btn-add" onclick="openEditModal(${p.id})">Izmeni</button>` 
                            : `<button class="btn-add" onclick="addToCart(${p.id})">Dodaj</button>` 
                        }
                    </div>`
                }
            </div>
        `).join(''); // Spajanje niza u jedan dugačak HTML string
    }
}

async function addToCart(productId) {
    const user = sessionStorage.getItem('loggedInUser');
    
    try {
        // Ponovo preuzimamo proizvode da bismo našli pun objekat na osnovu ID-ja
        const res = await fetch('http://localhost:3000/products');
        const products = await res.json();
        const product = products.find(p => p.id === productId);

        if (!product) return alert("Proizvod nije pronađen");

        // Slanje POST zahteva na backend sa informacijom ko kupuje i šta kupuje
        const cartResponse = await fetch('http://localhost:3000/add-to-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                product: product // Šaljemo ceo objekat proizvoda
            })
        });

        if (cartResponse.ok) {
            // Ovde bi mogla da se pozove funkcija showToast("Dodato u korpu!")
        } else {
            alert("Greška pri dodavanju u korpu.");
        }
    } catch (err) {
        console.error("Greška:", err);
    }
}