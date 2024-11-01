from flask import request, jsonify, session
from .models import User, Recipe
from .extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta
from dotenv import load_dotenv
import requests
import json
import os


# 환경 변수 로드
load_dotenv()


# Clova X API Executor class
class CompletionExecutor:
    def __init__(self, host, api_key, api_key_primary_val, request_id):
        self._host = host
        self._api_key = api_key
        self._api_key_primary_val = api_key_primary_val
        self._request_id = request_id

    def execute(self, completion_request):
        headers = {
            'X-NCP-CLOVASTUDIO-API-KEY': 'NTA0MjU2MWZlZTcxNDJiY/Rz0blcyYDXAHHK0pd7FU+mjPX7dpIfrHPnhogABuMZ',
            'X-NCP-APIGW-API-KEY': 'RMk0wbVjbcbtkoMAKlObP2XfOgpQNiJBLXUNozgq',
            'X-NCP-CLOVASTUDIO-REQUEST-ID': self._request_id,
            'Content-Type': 'application/json; charset=utf-8',
            # 'Accept': 'text/event-stream'
            'Accept': 'application/json'
        }
    
        response = requests.post(self._host + '/testapp/v1/chat-completions/HCX-DASH-001', headers=headers, json=completion_request)
         # Collect each line of the streamed response
        # 버퍼를 초기화하여 응답 데이터를 쌓기
        # 바로 JSON 파싱 시도
        try:
            response_data = response.json()
            return response_data
        except json.JSONDecodeError:
            # JSON 파싱 실패 시 에러 메시지 반환
            return {"error": "Failed to parse JSON from response", "raw_data": response.text}

        

# Register Flask routes
def register_routes(app):
    # Session timeout settings
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

    # Register user route
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

    # Login route
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

    # Logout route
    @app.route('/logout', methods=['POST'])
    def logout():
        session.pop('user_id', None)
        session.pop('username', None)
        return jsonify({'message': 'Logged out successfully'}), 200

    # Main page route
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
        size = int(request.args.get('size', 12))  # 페이지당 항목 수
        offset = (page - 1) * size

        # 음식 데이터를 DB에서 가져오기 (필요한 칼럼에 맞춰 조정)
        recipes = Recipe.query.offset(offset).limit(size).all()
        total_items = Recipe.query.count()

        result = {
            "recipes": [{"rcp_nm": r.rcp_nm, "att_file_no_main": r.att_file_no_main} for r in recipes],
            "total_pages": (total_items + size - 1) // size
        }

        return jsonify(result)    
        
        
    

    # Clova X Chat Route
    @app.route('/api/chat', methods=['POST'])
    def clova_x_chat():
        data = request.get_json()
        user_message = data.get('message')

        # Setup Clova X Executor
        completion_executor = CompletionExecutor(
            host='https://clovastudio.stream.ntruss.com',
            api_key='NTA0MjU2MWZlZTcxNDJiY/Rz0blcyYDXAHHK0pd7FU+mjPX7dpIfrHPnhogABuMZ',
            api_key_primary_val='RMk0wbVjbcbtkoMAKlObP2XfOgpQNiJBLXUNozgq',
            request_id='cf44e176ce2641a683767d7093e7476a'
        )

        preset_text = [
            {
                "role": "system",
                "content": "- 사용자가 가지고 있는 재료를 입력 받는다.\n\
                    - 선호하는 음식 장르, MBTI 등을 고려하여 최소 4개이상의 메뉴를 추천해준다.\n\
                    - 사용자가 메뉴를 선택하면 전체 조리과정과 소요시간을 알려준다.\n\
                    - 사용자가 단계별로 설명을 원하는 판단이 들면 다음을 따른다.\n\
                    - 사용자가 특정부분까지 완료되었다고 판단이 들면 확인 후 다음 과정부터 알려준다.\n\
                    - 과정마다 상세히 알려준다. 소요시간이 길면 뉴스, 날씨, 응원 등을 해주며 말을 걸어준다.\n\n"
            },
            {
                "role": "user",
                "content": user_message
            }
        ]

        request_data = {
            'messages': preset_text,
            'topP': 0.8,
            'topK': 0,
            'maxTokens': 400,
            'temperature': 0.5,
            'repeatPenalty': 6.5,
            'stopBefore': [],
            'includeAiFilters': True,
            'seed': 0
        }

        try:
            response_data = completion_executor.execute(request_data)
            
            # Print response for debugging
            print("Parsed response_data:", response_data)

            # Extract content, assuming response is structured correctly
            content = response_data.get("result", {}).get("message", {}).get("content", "")
            
            if not content:
                return jsonify({"response": "An error occurred while retrieving the recommended menu."}), 500
            
            return jsonify({"response": content})

        except Exception as e:
            print("Error in clova_x_chat:", e)
            return jsonify({"error": "An error occurred while processing your request."}), 500