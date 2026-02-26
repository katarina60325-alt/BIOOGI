async function loadUserStats(username) {
    try {
        const response = await fetch("http://localhost:3000/users");
        const users = await response.json();
        const currentUser = users.find((u) => u.username === username);

        if (currentUser && currentUser.height && currentUser.weight) {
            const h = currentUser.height / 100;
            const w = currentUser.weight;
            const bmi = (w / (h * h)).toFixed(1);

            document.getElementById("bmiValue").innerText = bmi;

            let status, recommendation, targetCategory, progressWidth;

            if (bmi < 18.5) {
                status = "Ispod normalne težine";
                recommendation = "BIOOGI Savet: Fokusiraj se na Protein liniju za izgradnju mase.";
                targetCategory = "Proteinsko";
                progressWidth = "40%";
            } else if (bmi < 25) {
                status = "Normalna težina";
                recommendation = "BIOOGI Savet: Održavaj balans uz naše Vegan Energy pločice.";
                targetCategory = "Vegan";
                progressWidth = "100%";
            } else {
                status = "Povišena težina";
                recommendation = "BIOOGI Savet: Preporučujemo liniju Bez Šećera za lakšu kontrolu kalorija.";
                targetCategory = "Bez Šećera";
                progressWidth = "60%";
            }

            document.getElementById("bmiStatus").innerText = "Status: " + status;
            document.getElementById("userRecommendation").innerText = recommendation;
            document.getElementById("bmiProgress").style.width = progressWidth;

            loadProductRecommendation(targetCategory);
            displayVerifiedDetails(currentUser);
        }
    } catch (err) {
        console.error("Greška pri učitavanju parametara:", err);
    }
}

async function loadProductRecommendation(category) {
    try {
        const prodRes = await fetch("http://localhost:3000/products");
        const products = await prodRes.json();
        const filtered = products.filter((p) => p.category === category);

        if (filtered.length > 0) {
            const randomProduct = filtered[Math.floor(Math.random() * filtered.length)];
            document.getElementById("recProductName").innerText = randomProduct.name;
            document.getElementById("recProductDesc").innerText = randomProduct.description;
            document.getElementById("recProductPrice").innerText = randomProduct.price + " RSD";
        } else {
            document.getElementById("recProductName").innerText = "BIOOGI Mix";
            document.getElementById("recProductDesc").innerText = "Trenutno nemamo specifičnu preporuku, probaj naš miks!";
        }
    } catch (err) {
        console.error("Greška pri učitavanju preporuke.");
    }
}

function displayVerifiedDetails(u) {
    if (u && u.isVerified) {
        document.getElementById("planStatusText").innerText = "AKTIVAN";
        document.getElementById("planStatusText").style.color = "var(--secondary-color)";
        document.getElementById("planDescText").innerText = "Plan je odobren od strane stručnjaka.";
        document.getElementById("planProgressBar").style.width = "100%";
        document.getElementById("planProgressBar").style.background = "var(--secondary-color)";

        document.getElementById("verifiedDetails").style.display = "block";
        document.getElementById("userAssignedPlan").innerText = u.plan;

        let cals, comment;
        if (u.plan === "Low-Calorie") {
            cals = "1800 - 2000 kcal";
            comment = "Fokus je na BIOOGI liniji 'Bez Šećera'. Preporučujemo konzumaciju uz jutarnju kafu.";
        } else if (u.plan === "Balanced") {
            cals = "2200 - 2400 kcal";
            comment = "Tvoj BMI je idealan. BIOOGI Vegan pločice su savršen međuobrok.";
        } else {
            cals = "2800+ kcal";
            comment = `S obzirom na tvoju visinu od ${u.height}cm, potreban je visok unos proteina.`;
        }

        document.getElementById("userCalories").innerText = cals;
        document.getElementById("expertComment").innerText = comment;
    } else {
        document.getElementById("recommendationCard").style.gridColumn = "span 1";
    }
}