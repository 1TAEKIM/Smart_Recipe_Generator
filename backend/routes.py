from flask import request, jsonify, session
from app import app, db
from models import User
from sqlalchemy.exc import IntegrityError

# 회원가입
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = data['password']
    
    # 중복된 사용자 이름 확인
    existing_user = User.query.filter_by(username=username).first()
    
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 409  # 409 Conflict
    
    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Error occurred during registration'}), 500
    
    return jsonify({'message': 'User registered successfully'}), 201



# 로그인
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        return jsonify({'message': 'Logged in successfully'}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

# 로그아웃
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200
