async function openEditModal(id) {
    try {
        // Preuzimamo sve proizvode kako bismo pronašli onaj sa traženim ID-jem
        const response = await fetch("http://localhost:3000/products");
        const products = await response.json();
        const p = products.find(prod => prod.id === id);

        if (p) {
            // Popunjavamo skriveno polje (ili obično) ID-jem kako bismo znali šta ažuriramo
            document.getElementById('editPId').value = p.id;
            // Popunjavamo inpute trenutnim vrednostima iz baze
            document.getElementById('editPName').value = p.name;
            document.getElementById('editPPrice').value = p.price;
            document.getElementById('editPCategory').value = p.category;
            document.getElementById('editPDesc').value = p.description;
            
            // Prikazujemo modalni prozor (postavljamo na 'flex' radi centriranja sadržaja)
            document.getElementById('editProductModal').style.display = 'flex';
        }
    } catch (err) {
        console.error("Greška pri preuzimanju proizvoda");
    }
}

function closeEditModal() {
    document.getElementById('editProductModal').style.display = 'none';
}

document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Sprečavamo standardno osvežavanje stranice
    
    // Uzimamo ID iz skrivenog polja koje smo popunili pri otvaranju modala
    const id = document.getElementById('editPId').value;
    
    // Pakujemo nove vrednosti iz input polja u jedan objekat
    const updatedData = {
        name: document.getElementById('editPName').value,
        price: document.getElementById('editPPrice').value,
        category: document.getElementById('editPCategory').value,
        description: document.getElementById('editPDesc').value
    };

    try {
        // Slanje zahteva serveru na specifičnu rutu sa ID-jem proizvoda
        const response = await fetch(`http://localhost:3000/update-product/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData) // Podatke šaljemo u JSON formatu
        });

        if (response.ok) {
            closeEditModal(); // Zatvaramo modal nakon uspeha
            loadProducts();   // Osvežavamo listu proizvoda da admin odmah vidi promene
        }
    } catch (err) {
        console.error("Greška pri slanju izmena");
    }
});