from flask import Flask, render_template, jsonify, request, send_from_directory, session
import sqlite3
import os
from datetime import timedelta

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/images'
app.secret_key = 'your_secret_key'  # Change this to a random secret key
app.permanent_session_lifetime = timedelta(minutes=30)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin/login')
def admin_login():
    return render_template('admin-login.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    return render_template('admin-dashboard.html')

@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
    conn = get_db_connection()
    if request.method == 'POST':
        new_product = request.get_json()
        cursor = conn.execute('INSERT INTO products (name, category, price, description, image, is_popular) VALUES (?, ?, ?, ?, ?, ?)',
                     (new_product['name'], new_product['category'], new_product['price'], new_product['description'], new_product['image'], new_product.get('is_popular', False)))
        conn.commit()
        new_product['id'] = cursor.lastrowid
        conn.close()
        return jsonify(new_product)

    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in products])

@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def handle_product(product_id):
    conn = get_db_connection()
    if request.method == 'PUT':
        product_data = request.get_json()
        conn.execute('UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ?, is_popular = ? WHERE id = ?',
                     (product_data['name'], product_data['category'], product_data['price'], product_data['description'], product_data['image'], product_data.get('is_popular', False), product_id))
        conn.commit()
        conn.close()
        return jsonify(product_data)

    if request.method == 'DELETE':
        # First, get the image path
        product = conn.execute('SELECT image FROM products WHERE id = ?', (product_id,)).fetchone()
        if product and product['image']:
            # Delete the image file
            try:
                os.remove(product['image'])
            except OSError as e:
                print(f"Error deleting file {product['image']}: {e.strerror}")
        conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})

@app.route('/api/reviews', methods=['GET', 'POST'])
def handle_reviews():
    conn = get_db_connection()
    if request.method == 'POST':
        new_review = request.get_json()
        cursor = conn.execute('INSERT INTO reviews (name, rating, text, date, url, image) VALUES (?, ?, ?, ?, ?, ?)',
                     (new_review['name'], new_review['rating'], new_review['text'], new_review['date'], new_review.get('url'), new_review.get('image')))
        conn.commit()
        new_review['id'] = cursor.lastrowid
        conn.close()
        return jsonify(new_review)

    reviews = conn.execute('SELECT * FROM reviews ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in reviews])

@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    conn = get_db_connection()
    # First, get the image path
    review = conn.execute('SELECT image FROM reviews WHERE id = ?', (review_id,)).fetchone()
    if review and review['image']:
        # Delete the image file
        try:
            os.remove(review['image'])
        except OSError as e:
            print(f"Error deleting file {review['image']}: {e.strerror}")
    conn.execute('DELETE FROM reviews WHERE id = ?', (review_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/orders', methods=['GET', 'POST'])
def handle_orders():
    conn = get_db_connection()
    if request.method == 'POST':
        new_order = request.get_json()
        cursor = conn.execute('INSERT INTO orders (full_name, mobile_number, email, reference_code, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                     (new_order['fullName'], new_order['mobileNumber'], new_order.get('email'), new_order['referenceCode'], new_order['items'], new_order['total'], 'pending', new_order['date']))
        conn.commit()
        new_order['id'] = cursor.lastrowid
        conn.close()
        return jsonify(new_order)

    orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in orders])

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    conn = get_db_connection()
    status = request.get_json()['status']
    conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/admin/login', methods=['POST'])
def admin_login_api():
    if 'login_attempts' not in session:
        session['login_attempts'] = 0

    if session['login_attempts'] >= 3:
        return jsonify({'success': False, 'message': 'Too many failed login attempts. Please try again later.'})

    conn = get_db_connection()
    credentials = request.get_json()
    user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?',
                        (credentials['username'], credentials['password'])).fetchone()
    conn.close()
    if user:
        session['logged_in'] = True
        session['login_attempts'] = 0
        session.permanent = True
        return jsonify({'success': True})
    else:
        session['login_attempts'] += 1
        return jsonify({'success': False, 'message': 'Invalid username or password'})

@app.route('/api/admin/logout')
def logout():
    session.pop('logged_in', None)
    return jsonify({'success': True})

@app.route('/api/admin/auth_check')
def auth_check():
    return jsonify({'logged_in': 'logged_in' in session})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = file.filename
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'filePath': os.path.join(app.config['UPLOAD_FOLDER'], filename)})

@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    conn = get_db_connection()
    if request.method == 'POST':
        new_category = request.get_json()
        try:
            cursor = conn.execute('INSERT INTO categories (name) VALUES (?)', (new_category['name'],))
            conn.commit()
            new_category['id'] = cursor.lastrowid
            conn.close()
            return jsonify(new_category)
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'Category already exists'}), 400

    categories = conn.execute('SELECT * FROM categories').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in categories])

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM categories WHERE id = ?', (category_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/sales_overview')
def sales_overview():
    conn = get_db_connection()
    sales_data = conn.execute("SELECT date(date) as sale_date, sum(total) as total_sales FROM orders WHERE status = 'completed' GROUP BY sale_date ORDER BY sale_date DESC LIMIT 7").fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in sales_data])

@app.route('/api/reviews/stats', methods=['GET'])
def review_stats():
    conn = get_db_connection()
    # Calculate average rating and total count
    stats = conn.execute('SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews').fetchone()
    conn.close()
    
    average_rating = stats['average_rating'] if stats['average_rating'] is not None else 0
    total_reviews = stats['total_reviews'] if stats['total_reviews'] is not None else 0
    
    return jsonify({
        'average_rating': round(average_rating, 1), # Round to one decimal place
        'total_reviews': total_reviews
    })

if __name__ == '__main__':
    app.run(debug=True)
