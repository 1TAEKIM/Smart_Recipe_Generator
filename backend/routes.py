from flask import request, jsonify, session
from .models import User
from .extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta

def register_routes(app):
    # 세션 만료 시간 설정
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

    # 회원가입
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

    # 로그인
    # 로그인 경로 수정
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

    # 로그아웃
    @app.route('/logout', methods=['POST'])
    def logout():
        session.pop('user_id', None)
        session.pop('username', None)
        return jsonify({'message': 'Logged out successfully'}), 200

    # 메인 페이지 (로그인 여부 확인)
    @app.route('/main', methods=['GET'])
    def main_page():
        if 'username' in session:
            username = session['username']
            return jsonify({'username': username}), 200
        else:
            return jsonify({'message': 'No user logged in'}), 401
