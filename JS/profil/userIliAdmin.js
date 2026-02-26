window.onload = async function () {
    const user = sessionStorage.getItem("loggedInUser");
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("welcomeUser").innerText = user;

    if (user.toLowerCase() === "admin") {
        document.getElementById("adminSection").style.display = "block";
        document.getElementById("addProductSection").style.display = "block";
        fetchUsers();
        fetchAdminOrders();
        fetchWaitingUsers(); // Ažurira broj zahteva na kartici odmah
    } else {
        document.getElementById("userSection").style.display = "block";
        loadUserStats(user);
        fetchCart(user);
        fetchUserOrders(user);
    }
};



function logout() {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}