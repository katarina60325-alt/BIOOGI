const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = 3000;
const DATA_FILE = "./baza/users.json";
const PRODUCTS_FILE = "./baza/products.json";
const CART_FILE = "./baza/cart.json";
const ORDERS_FILE = "./baza/orders.json";



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]));
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
if (!fs.existsSync(CART_FILE)) fs.writeFileSync(CART_FILE, JSON.stringify({}));


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {

    const safeName = (req.body && req.body.name) 
      ? req.body.name.toLowerCase().replace(/\s+/g, "") 
      : "product";
      
    const ext = path.extname(file.originalname);
    cb(null, `${safeName}.${ext}`);
  },
});

const upload = multer({ storage: storage });

const readData = (file) => JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));


app.get("/products", (req, res) => {
  res.json(readData(PRODUCTS_FILE));
});

app.post('/add-product', upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Slika nije primljena" });

        const products = readData(PRODUCTS_FILE);
        const newProduct = {
            id: Date.now(),
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            imagePath: `/uploads/${req.file.filename.toLowerCase().replace(/\s+/g, "")}`
        };

        products.push(newProduct);
        saveData(PRODUCTS_FILE, products);
        
        console.log("Novi proizvod dodat:", newProduct.name);
        res.json({ success: true, product: newProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Greška na serveru" });
    }
});

// --- KORISNICI RUTE ---

app.get("/users", (req, res) => {
  const users = readData(DATA_FILE);
  const safeUsers = users
    .map(({ password, ...rest }) => rest)
    .filter((user) => user.username.toLowerCase() !== "admin");
  res.json(safeUsers);
});

app.post("/register", (req, res) => {
  const { username, password, email, height, weight } = req.body;
  const users = readData(DATA_FILE);

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "Korisnik već postoji!" });
  }

  users.push({ username, password, email, isPlanVerified: false, height: parseInt(height), weight: parseInt(weight) });
  saveData(DATA_FILE, users);
  res.json({ message: "Uspešna registracija!" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readData(DATA_FILE);

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ message: "Uspešna prijava!", user: user.username });
  } else {
    res.status(401).json({ message: "Pogrešni podaci!" });
  }
});

app.delete("/delete-user/:username", (req, res) => {
  let users = readData(DATA_FILE);
  let orders = readData(ORDERS_FILE);
  let carts = readData(CART_FILE);
  // Obriši sve narudžbine tog korisnika
  orders = orders.filter(o => o.customer !== req.params.username);
  saveData(ORDERS_FILE, orders);
  // Obriši korpu tog korisnika
  delete carts[req.params.username];
  console.log(`Obrisana korpa korisnika: ${req.params.username}`);
  saveData(CART_FILE, carts);
  users = users.filter((u) => u.username !== req.params.username);

  saveData(DATA_FILE, users);
  res.json({ message: "Korisnik obrisan" });
});

app.put("/update-product/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, price, category, description } = req.body;
  
  let products = readData(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === productId);

  if (index !== -1) {
    // Menjamo samo tekstualne podatke, slika ostaje ista
    products[index] = { 
      ...products[index], 
      name, 
      price, 
      category, 
      description 
    };
    
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    res.json({ success: true, message: "Proizvod ažuriran" });
  } else {
    res.status(404).json({ error: "Proizvod nije nađen" });
  }
});


// Pomoćna funkcija za čitanje korpe
const readCart = () => {
    if (!fs.existsSync(CART_FILE)) fs.writeFileSync(CART_FILE, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(CART_FILE, 'utf8'));
};

// RUTA ZA DODAVANJE U KORPU
app.post("/add-to-cart", (req, res) => {
    const { username, product } = req.body;
    if (!username) return res.status(401).json({ error: "Niste ulogovani" });

    let carts = readCart();

    // Ako korisnik prvi put dodaje, napravi mu niz
    if (!carts[username]) {
        carts[username] = [];
    }

    // Dodajemo proizvod u niz tog korisnika
    carts[username].push({
        ...product,
        cartItemId: Date.now() // Jedinstveni ID za stavku u korpi (zbog brisanja kasnije)
    });

    fs.writeFileSync(CART_FILE, JSON.stringify(carts, null, 2));
    res.json({ success: true, message: "Dodato u korpu!" });
});

// RUTA ZA PREUZIMANJE KORPE ODREĐENOG KORISNIKA
app.get("/get-cart/:username", (req, res) => {
    const carts = readCart();
    const userCart = carts[req.params.username] || [];
    res.json(userCart);
});

app.delete("/remove-from-cart", (req, res) => {
    const { username, cartItemId } = req.body;
    let carts = JSON.parse(fs.readFileSync("./cart.json", 'utf8') || '{}');

    if (carts[username]) {
        // Filtriramo stavku po cartItemId koji smo dodali pri ubacivanju
        carts[username] = carts[username].filter(item => item.cartItemId != cartItemId);
        fs.writeFileSync(CART_FILE, JSON.stringify(carts, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Korpa nije nađena" });
    }
});


// Pomoćna funkcija za čitanje narudžbina
const readOrders = () => {
    if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
};

// --- RUTA ZA CHECKOUT (Završetak kupovine) ---
app.post("/checkout", (req, res) => {
    const { username } = req.body;
    
    // Učitaj korpe
    let carts = {};
    if (fs.existsSync(CART_FILE)) {
        carts = JSON.parse(fs.readFileSync(CART_FILE, 'utf8') || '{}');
    }

    // Provera korpe
    if (!carts[username] || carts[username].length === 0) {
        return res.status(400).json({ error: "Korpa je prazna" });
    }

    let orders = readOrders();

    // Kreiranje narudžbine
    const newOrder = {
        orderId: "ORD-" + Date.now(),
        customer: username,
        items: carts[username],
        total: carts[username].reduce((sum, item) => sum + parseInt(item.price), 0),
        date: new Date().toLocaleString("sr-RS"),
        status: "Na čekanju"
    };

    orders.push(newOrder);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

    // ISPRAZNI KORPU za tog korisnika
    carts[username] = [];
    fs.writeFileSync(CART_FILE, JSON.stringify(carts, null, 2));

    res.json({ success: true, order: newOrder });
});

// Ruta za običnog korisnika (vidi samo svoje)
app.get('/get-orders/:username', (req, res) => {
    const username = req.params.username;
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    
    const userOrders = orders.filter(o => o.customer === username);
    res.json(userOrders);
});

// Ruta za admina (vidi sve porudžbine svih korisnika)
app.get('/admin/orders', (req, res) => {
    // Ovde bi u realnom svetu išla provera da li je user zaista admin
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    res.json(orders);
});

// Ruta za potvrdu i dodelu plana
app.put('/verify-user', (req, res) => {
    const { username, assignedPlan } = req.body;
    let users = JSON.parse(fs.readFileSync('./users.json'));
    
    const user = users.find(u => u.username === username);
    if (user) {
        user.isVerified = true;
        user.plan = assignedPlan; // 'Low-Calorie', 'Balanced', ili 'High-Protein'
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        res.json({ message: `Plan "${assignedPlan}" uspešno dodeljen korisniku ${username}!` });
    } else {
        res.status(404).send("Korisnik nije nađen");
    }
});

app.listen(PORT, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `BIOOGI server pokrenut na http://localhost:${PORT}`);
});