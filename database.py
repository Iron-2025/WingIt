import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    print("Opened database successfully")

    conn.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT
    );
    ''')
    print("Table 'products' created successfully")

    conn.execute('DROP TABLE IF EXISTS reviews')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        text TEXT NOT NULL,
        date TEXT NOT NULL,
        url TEXT,
        image TEXT
    );
    ''')
    print("Table 'reviews' created successfully")

    conn.execute('DROP TABLE IF EXISTS orders')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        mobile_number TEXT NOT NULL,
        email TEXT,
        reference_code TEXT NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        date TEXT NOT NULL
    );
    ''')
    print("Table 'orders' created successfully")

    conn.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );
    ''')
    print("Table 'users' created successfully")

    conn.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );
    ''')
    print("Table 'categories' created successfully")

    conn.close()

def seed_db():
    conn = sqlite3.connect('database.db')
    print("Seeding database...")

    menuItems = [
        (1, "Margherita Pizza", "pizza", 12.99, "Fresh tomatoes, mozzarella, basil", "/placeholder.svg?height=200&width=300"),
        (2, "Pepperoni Pizza", "pizza", 14.99, "Pepperoni, mozzarella, tomato sauce", "/placeholder.svg?height=200&width=300"),
        (3, "Classic Burger", "burger", 9.99, "Beef patty, lettuce, tomato, onion", "/placeholder.svg?height=200&width=300"),
        (4, "Chicken Burger", "burger", 10.99, "Grilled chicken, lettuce, mayo", "/placeholder.svg?height=200&width=300"),
        (5, "Caesar Salad", "salad", 8.99, "Romaine lettuce, parmesan, croutons", "/placeholder.svg?height=200&width=300"),
        (6, "Greek Salad", "salad", 9.99, "Tomatoes, olives, feta cheese", "/placeholder.svg?height=200&width=300"),
        (7, "Coca Cola", "drink", 2.99, "Refreshing cola drink", "/placeholder.svg?height=200&width=300"),
        (8, "Orange Juice", "drink", 3.99, "Fresh squeezed orange juice", "/placeholder.svg?height=200&width=300")
    ]

    reviews = [
        (1, "John Doe", 5, "Amazing food and great service! Highly recommended.", "2024-01-15", None, None),
        (2, "Jane Smith", 4, "Delicious pizza, will order again.", "2024-01-14", None, None),
        (3, "Mike Johnson", 5, "Best burgers in town!", "2024-01-13", None, None)
    ]

    categories = [('pizza',), ('burger',), ('salad',), ('drink',)]

    conn.executemany("INSERT OR IGNORE INTO products (id, name, category, price, description, image) VALUES (?,?,?,?,?,?)", menuItems)
    conn.executemany("INSERT OR IGNORE INTO reviews (id, name, rating, text, date, url, image) VALUES (?,?,?,?,?,?,?)", reviews)
    conn.executemany("INSERT OR IGNORE INTO categories (name) VALUES (?)", categories)

    # Add a default admin user
    try:
        conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", ('admin', 'password123'))
        print("Admin user created successfully")
    except sqlite3.IntegrityError:
        print("Admin user already exists")


    conn.commit()
    print("Database seeded successfully")
    conn.close()

if __name__ == '__main__':
    init_db()
    seed_db()
