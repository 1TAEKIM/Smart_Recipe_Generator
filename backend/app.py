import os
from flask import Flask
from flask_session import Session
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta
from backend.extensions import db, bcrypt  # extensions에서 가져옴
from flask_migrate import Migrate  # 마이그레이션 모듈 추가
import logging
from logging import FileHandler

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# 환경 변수에서 DB 정보 가져오기
DB_USERNAME = os.getenv('DB_USERNAME')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

# DB 설정
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 세션 설정
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# 초기화
db.init_app(app)
bcrypt.init_app(app)
Session(app)

# Flask-Migrate 초기화
# 마이그레이션 설정 추가
migrate = Migrate(app, db)

# 경로에서 처리할 모든 라우트를 import
from backend.routes import register_routes

# 로깅 설정
file_handler = FileHandler('errorlog.txt')
file_handler.setLevel(logging.WARNING)
app.logger.addHandler(file_handler)

# Routes 등록
register_routes(app)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
