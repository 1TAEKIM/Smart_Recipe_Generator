from flask import request, jsonify, session
from .models import User, Recipe  # Assuming you have a Recipe model
from .extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta

def register_routes(app):
    # Session timeout settings
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

    # Register user
    @app.route('/register', methods=['POST', 'OPTIONS'])
    def register():
        if request.method == 'OPTIONS':
            response = app.response_class(status=200)
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS, GET, DELETE, PUT")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

        data = request.get_json()
        username = data['username']
        email = data['email']
        password = data['password']

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'message': 'Username already exists'}), 409

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)

        try:
            db.session.commit()
            return jsonify({'message': 'User registered successfully'}), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'message': 'Error occurred during registration'}), 500

    # Login user
    @app.route('/login', methods=['POST', 'OPTIONS'])
    def login():
        if request.method == 'OPTIONS':
            response = app.response_class(status=200)
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

        data = request.get_json()
        username = data['username']
        password = data['password']

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            session.permanent = True
            return jsonify({'message': 'Logged in successfully'}), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401

    # Logout user
    @app.route('/logout', methods=['POST'])
    def logout():
        session.pop('user_id', None)
        session.pop('username', None)
        return jsonify({'message': 'Logged out successfully'}), 200

    # Main page: Check if user is logged in
    @app.route('/main', methods=['GET'])
    def main_page():
        if 'username' in session:
            username = session['username']
            return jsonify({'username': username}), 200
        else:
            return jsonify({'message': 'No user logged in'}), 401

    # Get recipe data with pagination
    @app.route('/api/recipes', methods=['GET'])
    def get_recipes():
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 9))  # 페이지당 항목 수
        offset = (page - 1) * size

        # 음식 데이터를 DB에서 가져오기 (필요한 칼럼에 맞춰 조정)
        recipes = Recipe.query.offset(offset).limit(size).all()
        total_items = Recipe.query.count()

        result = {
            "recipes": [{"rcp_nm": r.rcp_nm, "att_file_no_main": r.att_file_no_main} for r in recipes],
            "total_pages": (total_items + size - 1) // size
        }

        return jsonify(result)
