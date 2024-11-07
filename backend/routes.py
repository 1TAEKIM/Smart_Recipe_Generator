from flask import request, jsonify, session, send_file
from .models import User, Recipe, Conversation
from .extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta
from dotenv import load_dotenv
import requests
import json
import os
import re
from io import BytesIO
from datetime import datetime


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
            'X-NCP-CLOVASTUDIO-API-KEY': self._api_key,
            'X-NCP-APIGW-API-KEY': self._api_key_primary_val,
            'X-NCP-CLOVASTUDIO-REQUEST-ID': self._request_id,
            'Content-Type': 'application/json; charset=utf-8',
            # 'Accept': 'text/event-stream'
            'Accept': 'application/json'
        }
    
        response = requests.post(self._host + '/testapp/v1/chat-completions/HCX-DASH-001', headers=headers, json=completion_request)
        
        try:
            response_data = response.json()
            return response_data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON from response", "raw_data": response.text}
        
        
class SummaryExecutor:
    def __init__(self):
        self.host = "https://naveropenapi.apigw.ntruss.com"
        self.api_url = "/text-summary/v1/summarize"
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")

    def summarize_text(self, content):
        headers = {
            "X-NCP-APIGW-API-KEY-ID": self.client_id,
            "X-NCP-APIGW-API-KEY": self.client_secret,
            "Content-Type": "application/json"
        }

        payload = {
            "document": {
                "content": content  # 요약할 텍스트
            },
            "option": {
                "language": "ko",       # 요약할 언어 설정 
                "model": "general",     # 요약 모델 설정 
                "tone": 2,              # 요약 톤 설정 
                "summaryCount": 1       # 요약할 문장 수
            }
        }

        response = requests.post(
            self.host + self.api_url,
            headers=headers,
            json=payload
        )

        
        if response.status_code == 200:
            return response.json().get("summary", "요약 실패")
        else:
        
            # print(f"Error: {response.status_code}, Response: {response.text}")
            return f"Error: {response.status_code}"
        

# Register Flask routes
def register_routes(app):
    # Session timeout settings
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
    
    @app.route('/api/check-username', methods=['GET'])
    def check_username():
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        # 해당 유저네임이 이미 존재하는지 확인
        existing_user = User.query.filter_by(username=username).first()
        
        # None이면 사용 가능
        is_available = existing_user is None

        return jsonify({'available': is_available}), 200


    
    def validate_password(password):
        if len(password) < 8:
            return "Password must be at least 8 characters long"
        if not re.search(r"[A-Z]", password):
            return "Password must contain at least one uppercase letter"
        if not re.search(r"[a-z]", password):
            return "Password must contain at least one lowercase letter"
        if not re.search(r"[0-9]", password):
            return "Password must contain at least one number"
        if not re.search(r"[!@#$%^&*()_+=-]", password):
            return "Password must contain at least one special character (!@#$%^&*()_+=-)"
        return None
    
    
    # Register user route
    @app.route('/api/register', methods=['POST', 'OPTIONS'])
    def register():
        if request.method == 'OPTIONS':
            response = app.response_class(status=200)
            response.headers.add("Access-Control-Allow-Origin", "http://reciperecom.store")
            response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS, GET, DELETE, PUT")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

        data = request.get_json()
        if data is None:
            print("Error: Invalid JSON data received")
            return jsonify({'message': 'Invalid JSON data'}), 400

        # 필수 필드 확인
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        favorite_food = data.get('favoriteFood') or None  
        spice_level = data.get('spiceLevel') or None 

        # print(f"Received data: username={username}, email={email}, password={password}, favorite_food={favorite_food}, spice_level={spice_level}")

        if not username or not email or not password:
            # print("Error: Required fields missing")
            return jsonify({'message': 'Username, email, and password are required'}), 400

        # 사용자 이름 중복 확인
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            # print("Error: User with the same username already exists")
            return jsonify({'message': '동일한 유저가 존재합니다'}), 409

        # 이메일 중복 확인 추가
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            # print("Error: User with the same email already exists")
            return jsonify({'message': '이미 사용 중인 이메일입니다'}), 409

        # 비밀번호 유효성 검사
        password_error = validate_password(password)
        if password_error:
            # print(f"Password validation error: {password_error}")
            return jsonify({'message': password_error}), 400

        new_user = User(username=username, email=email, favorite_food=favorite_food, spice_level=spice_level)
        new_user.set_password(password)
        db.session.add(new_user)

        try:
            db.session.commit()
            print("User registered successfully")
            return jsonify({'message': 'User registered successfully'}), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"SQLAlchemyError: {e}")
            return jsonify({'message': 'Error occurred during registration'}), 500

    # Login route
    @app.route('/api/login', methods=['POST', 'OPTIONS'])
    def login():
        if request.method == 'OPTIONS':
            response = app.response_class(status=200)
            response.headers.add("Access-Control-Allow-Origin", "http://reciperecom.store")
            response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

        data = request.get_json()
        username = data['username']
        password = data['password']

        user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({'message': '아이디가 틀렸습니다.'}), 401
        elif not user.check_password(password):
            return jsonify({'message': '비밀번호가 틀렸습니다.'}), 401

        session['user_id'] = user.id
        session['username'] = user.username
        session.permanent = True
        return jsonify({'message': 'Logged in successfully'}), 200


    # Logout route
    @app.route('/api/logout', methods=['POST'])
    def logout():
        session.pop('user_id', None)
        session.pop('username', None)
        return jsonify({'message': 'Logged out successfully'}), 200

    
    # Get recipe data with pagination and category filter
    @app.route('/api/recipes', methods=['GET'])
    def get_recipes():
        page = int(request.args.get('page', 1))
        size = int(request.args.get('limit', 12))  # 페이지당 항목 수
        category = request.args.get('category', None)
        offset = (page - 1) * size

        query = Recipe.query
        if category:
            query = query.filter_by(rcp_pat2=category)  # 선택한 카테고리로 필터링

        recipes = query.with_entities(Recipe.id, Recipe.rcp_nm, Recipe.att_file_no_main).offset(offset).limit(size).all()
        total_items = query.count()

        
        result = {
        "recipes": [{"id": r.id, "rcp_nm": r.rcp_nm, "att_file_no_main": r.att_file_no_main} for r in recipes],
        "total_pages": (total_items + size - 1) // size
        }

        return jsonify(result)


    @app.route('/api/recipe/<int:recipe_id>', methods=['GET'])
    def get_recipe_details(recipe_id):
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404

        # recipe 데이터를 딕셔너리 형태로 변환
        recipe_data = recipe.to_dict()

        # 단계별 조리 과정과 이미지 확인을 위한 디버깅
        steps = []
        for i in range(1, 21):
            manual_key = f'manual{i:02}'
            manual_img_key = f'manual_img{i:02}'

            # 각 필드에 접근하여 값을 확인합니다.
            manual = recipe_data.get(manual_key)
            manual_img = recipe_data.get(manual_img_key)

            # manual 값이 유효한 경우에만 추가
            if manual and manual.strip():
                step_data = {
                    'step': i,
                    'description': manual.strip(),
                }
                # 이미지가 있을 경우 추가
                if manual_img and manual_img.strip():
                    step_data['image'] = manual_img.strip()
                steps.append(step_data)

        result = {
            'id': recipe.id,
            'name': recipe.rcp_nm,
            'main_image': recipe.att_file_no_main,  # 메인 이미지 추가
            'ingredients': recipe.rcp_parts_dtls,   # 재료 정보 추가
            'tip': recipe.rcp_na_tip,               # 요리 팁 정보 추가
            'steps': steps
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
            api_key=os.getenv('CLOVA_X_API_KEY'),
            api_key_primary_val=os.getenv('CLOVA_X_API_KEY_PRIMARY_VAL'),
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
            


    @app.route('/api/main', methods=['GET'])
    def main_page():
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                user_info = {
                    'username': user.username,
                    'email': user.email,
                    'favoriteFood': user.favorite_food,
                    'spiceLevel': user.spice_level
                }
                return jsonify(user_info), 200
        return jsonify({'message': 'No user logged in'}), 401


    @app.route('/api/update-user', methods=['PUT'])
    def update_user():
        if 'user_id' not in session:
            return jsonify({'message': 'Unauthorized'}), 401

        user = User.query.get(session['user_id'])
        if user:
            data = request.get_json()
            user.favorite_food = data.get('favoriteFood', user.favorite_food)
            user.spice_level = data.get('spiceLevel', user.spice_level)

            db.session.commit()
            return jsonify({'message': 'User information updated successfully'}), 200
        else:
            return jsonify({'message': 'User not found'}), 404


    @app.route('/api/change-password', methods=['POST'])
    def change_password():
        if 'user_id' not in session:
            return jsonify({'message': 'Not logged in'}), 401

        data = request.get_json()
        new_password = data.get('newPassword')
        user = User.query.get(session['user_id'])

        if user:
            user.set_password(new_password)
            db.session.commit()
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'message': 'User not found'}), 404




    # Conversation 저장 API
    @app.route('/api/save-conversation', methods=['POST'])
    def save_conversation():
        data = request.get_json()
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        # 사용자의 메시지와 Clova X의 답변을 모두 포함
        original_text = "\n".join([msg['message'] for msg in data.get('messages', [])])

        # 요약할 텍스트가 충분한지 확인 (단어 수 제한 추가)
        if len(original_text.split()) < 10:
            summary_text = "대화 내용이 요약하기에 충분하지 않습니다."
        else:
            # Clova Summary API를 사용하여 요약 생성
            summary_executor = SummaryExecutor()
            summary_text = summary_executor.summarize_text(original_text)
            if "Error:" in summary_text:  # 요약 실패 시
                summary_text = "요약에 실패했습니다."

        # 대화 및 요약을 데이터베이스에 저장
        conversation = Conversation(user_id=user_id, original_text=original_text, summary_text=summary_text)
        db.session.add(conversation)
        db.session.commit()

        return jsonify({'message': 'Conversation saved successfully'}), 200



    # 마이페이지에서 대화 목록 조회 API
    @app.route('/api/conversations', methods=['GET'])
    def get_conversations():
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        conversations = Conversation.query.filter_by(user_id=user_id).all()
        return jsonify({
            'conversations': [
                {
                    'id': conv.id,
                    'created_at': conv.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'summary_text': conv.summary_text
                } for conv in conversations
            ]
        })



    @app.route('/api/conversation/<int:id>', methods=['DELETE'])
    def delete_conversation(id):
        conversation = Conversation.query.get(id)
        if not conversation:
            return jsonify({'message': 'Conversation not found'}), 404
        db.session.delete(conversation)
        db.session.commit()
        return jsonify({'message': 'Conversation deleted successfully'}), 200
