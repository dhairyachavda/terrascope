from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
import bcrypt
from datetime import timedelta
import os
from dotenv import load_dotenv
import re
import pymysql

load_dotenv()

app = Flask(__name__)
CORS(app)

# ===== JWT CONFIG =====
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
jwt = JWTManager(app)

# ===== DB CONFIG (PyMySQL) =====
DB_HOST = os.getenv('MYSQL_HOST', 'localhost')
DB_USER = os.getenv('MYSQL_USER', 'root')
DB_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
DB_NAME = os.getenv('MYSQL_DB', 'eco_monitor')


def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.Cursor,
    )

# ===== PAGES =====


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# ===== API ROUTES =====


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Server is running'}), 200


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()

        if not data or not all(k in data for k in ['name', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400

        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']

        if not is_valid_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Email already registered'}), 409

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'),
                                        bcrypt.gensalt()).decode('utf-8')

        # Insert user
        cursor.execute(
            'INSERT INTO users (name, email, password) VALUES (%s, %s, %s)',
            (name, email, hashed_password)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Account created successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data or not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Missing email or password'}), 400

        email = data['email'].strip().lower()
        password = data['password']

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, name, email, password FROM users WHERE email = %s',
            (email,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        stored_hash = user[3]

        if not bcrypt.checkpw(password.encode('utf-8'),
                              stored_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401

        access_token = create_access_token(
            identity=user[0],
            additional_claims={'email': user[2], 'name': user[1]}
        )

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user[0],
                'name': user[1],
                'email': user[2]
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    from flask_jwt_extended import get_jwt_identity, get_jwt

    user_id = get_jwt_identity()
    claims = get_jwt()

    return jsonify({
        'valid': True,
        'user_id': user_id,
        'email': claims.get('email'),
        'name': claims.get('name')
    }), 200

# ===== HELPERS & ERRORS =====


def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
