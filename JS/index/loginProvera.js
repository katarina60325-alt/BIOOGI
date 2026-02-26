let user;

window.onload = function() {
    let user = sessionStorage.getItem('loggedInUser');
    if (user) {
        const navBtn = document.querySelector('.nav-btn');
        if (navBtn) {
            navBtn.innerText = "Profil: " + user;
            navBtn.href = "#"; 
            navBtn.onclick = function() {
                window.location.href = 'profil.html';
            };
        }
    }

    loadProducts();
}