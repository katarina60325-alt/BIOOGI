// Osluškivanje promene na input polju za sliku
document.getElementById("pImage")?.addEventListener("change", function (event) {
    const file = event.target.files[0]; // Uzimamo prvi izabrani fajl
    const preview = document.getElementById("imagePreview");
    
    if (file) {
        const reader = new FileReader();
        // Kada čitač završi sa učitavanjem fajla...
        reader.onload = (e) => {
            preview.src = e.target.result; // Postavljamo izvor slike na pročitani podatak
            preview.style.display = "block"; // Prikazujemo sliku na ekranu
        };
        reader.readAsDataURL(file); // Čitamo fajl kao Base64 URL
    }
});

// Funkcija za dobavljanje i prikaz svih korisnika u admin panelu
async function fetchUsers() {
    try {
        const response = await fetch("http://localhost:3000/users");
        const users = await response.json();
        const list = document.getElementById("userList");

        if (!list) return;

        // Filtriramo admina da ne bismo slučajno obrisali sami sebe
        const regularUsers = users.filter(u => u.username.toLowerCase() !== 'admin');

        if (regularUsers.length === 0) {
            list.innerHTML = '<p class="stat-desc">Nema registrovanih korisnika.</p>';
            return;
        }

        list.innerHTML = regularUsers.map(u => `
            <li class="user-item">
                <div class="user-details">
                    <span class="user-name">${u.username}</span> 
                    <span class="user-email">${u.email || 'Nema email'}</span>
                    <span class="user-plan-badge">${u.isVerified ? u.plan : 'Nije verifikovan'}</span>
                </div>
                <button onclick="openDeleteModal('${u.username}')" class="delete-btn" title="Obriši korisnika">🗑️</button>
            </li>
        `).join("");
    } catch (err) {
        console.error("Greška pri učitavanju korisnika:", err);
        const list = document.getElementById("userList");
        if (list) list.innerHTML = '<p style="color:red;">Greška u komunikaciji sa serverom.</p>';
    }
}

// Dodavanje proizvoda
document.getElementById("productForm")?.addEventListener("submit", async (e) => {
    e.preventDefault(); // Sprečavamo osvežavanje stranice
    const formData = new FormData(); // Kreiramo objekat za slanje podataka
    
    // Ručno dodavanje polja u formu
    formData.append("name", document.getElementById("pName").value);
    formData.append("price", document.getElementById("pPrice").value);
    formData.append("category", document.getElementById("pCategory").value);
    formData.append("description", document.getElementById("pDesc").value);

    const imageFile = document.getElementById("pImage").files[0];
    if (imageFile) formData.append("image", imageFile);

    try {
        const response = await fetch("http://localhost:3000/add-product", {
            method: "POST",
            body: formData, // Šaljemo formData umesto JSON-a
        });
        if (response.ok) {
            msg.innerText = "Uspešno sačuvano!";
            e.target.reset(); // Čistimo formu nakon uspeha
            document.getElementById("imagePreview").style.display = "none";
        }
    } catch (err) {
        msg.innerText = "Greška pri čuvanju.";
    }
});

// Brisanje korisnika (Modal logika)
// Brisanje korisnika (Modal logika)
let userToDelete = null; // Globalna promenljiva koja pamti koga brišemo

function openDeleteModal(username) {
    userToDelete = username; // Skladištimo ime korisnika
    document.getElementById("modalUsername").innerText = username;
    document.getElementById("deleteModal").style.display = "flex"; // Otvaramo modal
    
    // Na klik potvrde, izvršavamo stvarno brisanje
    document.getElementById("confirmDeleteBtn").onclick = executeDelete;
}

async function executeDelete() {
    if (!userToDelete) return;
    try {
        const response = await fetch(`http://localhost:3000/delete-user/${userToDelete}`, { 
            method: "DELETE" 
        });
        if (response.ok) {
            closeDeleteModal();
            fetchUsers(); // Osvežavamo listu korisnika bez reload-a stranice
        }
    } catch (err) {
        alert("Greška pri brisanju!");
    }
}
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}



// Validacija planova
function openValidationModal() {
    document.getElementById("validationModal").style.display = "block";
    fetchWaitingUsers();
}

function closeModal() {
    document.getElementById("validationModal").style.display = "none";
}

async function fetchWaitingUsers() {
    try {
        const response = await fetch("http://localhost:3000/users");
        const users = await response.json();
        const list = document.getElementById("waitingList");
        const waitingUsers = users.filter((u) => !u.isVerified);

        document.getElementById("waitingCount").innerText = `${waitingUsers.length} AI plana čeka tvoje odobrenje.`;

        if (waitingUsers.length === 0) {
            list.innerHTML = "<p>Trenutno nema novih zahteva.</p>";
            return;
        }

        list.innerHTML = waitingUsers.map((u) => {
            const bmi = (u.weight / ((u.height / 100) ** 2)).toFixed(1);
            return `
                <li class="waiting-item">
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <span style="font-weight: 900;">${u.username}</span>
                            <p>BMI: ${bmi} (${u.height}cm / ${u.weight}kg)</p>
                        </div>
                    </div>
                    <div class="user-actions" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <button class="plan-btn btn-low" onclick="verifyPlan('${u.username}', 'Low-Calorie')">📉 NISKI</button>
                        <button class="plan-btn btn-mid" onclick="verifyPlan('${u.username}', 'Balanced')">⚖️ SREDNJI</button>
                        <button class="plan-btn btn-high" onclick="verifyPlan('${u.username}', 'High-Protein')">💪 VISOKI</button>
                    </div>
                </li>`;
        }).join("");
    } catch (err) {
        console.error("Greška pri učitavanju zahteva.");
    }
}

async function verifyPlan(username, planName) {
    try {
        const response = await fetch("http://localhost:3000/verify-user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, assignedPlan: planName }),
        });
        if (response.ok) {
            closeModal();
            fetchUsers();
            fetchWaitingUsers();
            showToast(`Uspešno dodeljen ${planName} plan!`);
        }
    } catch (err) {
        console.error("Greška pri verifikaciji.");
    }
}


function showToast(text) {
    const toast = document.createElement("div");
    toast.innerText = `✅ ${text}`;
    toast.style = "position:fixed; bottom:20px; right:20px; background:#4CAF50; color:white; padding:15px; border-radius:8px; z-index:1000;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Zatvaranje modala na klik van njih
window.onclick = function (event) {
    if (event.target.className === "modal" || event.target.className === "modal-overlay") {
        closeModal();
        closeDeleteModal();
    }
};