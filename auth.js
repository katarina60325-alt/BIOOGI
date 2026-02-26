// Izmenjena funkcija za Registraciju u auth.js
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const data = {
        username: document.getElementById('regUser').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPass').value
    };

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);
        if (response.ok) window.location.href = 'login.html';
    } catch (err) {
        console.error("Greška pri konekciji sa serverom");
    }
});