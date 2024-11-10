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
import subprocess
from werkzeug.utils import secure_filename
import urllib.request



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
         # Collect each line of the streamed response
        # 버퍼를 초기화하여 응답 데이터를 쌓기
        # 바로 JSON 파싱 시도
        try:
            response_data = response.json()
            return response_data
        except json.JSONDecodeError:
            # JSON 파싱 실패 시 에러 메시지 반환
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
                "language": "ko",       # 요약할 언어 설정 (한국어: ko)
                "model": "general",     # 요약 모델 설정 (일반 텍스트: general)
                "tone": 2,              # 요약 톤 설정 (예: 2는 간결한 톤)
                "summaryCount": 1       # 요약할 문장 수
            }
        }

        response = requests.post(
            self.host + self.api_url,
            headers=headers,
            json=payload
        )

        # 응답 코드 확인 및 요약 텍스트 반환
        if response.status_code == 200:
            return response.json().get("summary", "요약 실패")
        else:
            # 에러 코드와 에러 메시지 출력
            print(f"Error: {response.status_code}, Response: {response.text}")
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
        is_available = existing_user is None  # None이면 사용 가능

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
        favorite_food = data.get('favoriteFood') or None  # 선택 사항이 비워져 있을 경우 None으로 저장
        spice_level = data.get('spiceLevel') or None     # 선택 사항이 비워져 있을 경우 None으로 저장
        birthdate = data.get('birthdate') or None

        print(f"Received data: username={username}, email={email}, password={password}, favorite_food={favorite_food}, spice_level={spice_level}")

        if not username or not email or not password:
            print("Error: Required fields missing")
            return jsonify({'message': 'Username, email, and password are required'}), 400

        # 사용자 이름 중복 확인
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print("Error: User with the same username already exists")
            return jsonify({'message': '동일한 유저가 존재합니다'}), 409

        # 이메일 중복 확인 추가
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print("Error: User with the same email already exists")
            return jsonify({'message': '이미 사용 중인 이메일입니다'}), 409

        # 비밀번호 유효성 검사
        password_error = validate_password(password)
        if password_error:
            print(f"Password validation error: {password_error}")
            return jsonify({'message': password_error}), 400

        new_user = User(username=username, email=email, favorite_food=favorite_food, spice_level=spice_level, birthdate=birthdate)
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


    @app.route('/api/recipes', methods=['GET'])
    def get_recipes():
        page = int(request.args.get('page', 1))
        size = int(request.args.get('limit', 12))
        main_category = request.args.get('category', None)
        sub_category = request.args.get('subCategory', None)
        offset = (page - 1) * size

        query = Recipe.query
        if main_category:
            query = query.filter_by(category=main_category)
        if sub_category:
            query = query.filter_by(rcp_pat2=sub_category)  # 서브 카테고리 필터링

        # recipes = query.offset(offset).limit(size).all()
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

        
        username = data.get('username')  # Get the username from the request

    # Retrieve user information based on username
        user = User.query.filter_by(username=username).first()
        
        # 사용자 정보 기반의 추가 메시지 설정
        user_info = ""
        if user:
            if user.favorite_food:
                user_info += f"사용자의 선호 음식은 {user.favorite_food}입니다. "
            if user.spice_level:
                user_info += f"사용자의 선호 매운맛 레벨은 {user.spice_level}입니다. "
            if user.birthdate:
                age = datetime.now().year - user.birthdate.year
                user_info += f"사용자의 나이는 {age}세입니다. "
        
        
        
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
                    - 선호하는 음식 장르, 맵기 정도 등을 고려하여 최소 4개이상의 메뉴를 추천해준다.\n\
                    - 사용자가 메뉴를 선택하면 전체 조리과정과 소요시간을 알려준다.\n\
                    - 과정마다 상세히 알려준다.\n"
                    + user_info
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
            user.birthdate = data.get('birthdate', user.birthdate)  # 생년월일 업데이트 추가

            db.session.commit()
            return jsonify({'message': '수정되었습니다:)'}), 200
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



################################################################################################################

    # 네이버 음성 인식 API 호출 엔드포인트
    @app.route('/api/speech-to-text', methods=['POST'])
    def speech_to_text():
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        original_path = 'uploaded_audio.webm'
        converted_path = 'converted_audio.mp3'

        # 업로드된 파일을 저장
        audio_file.save(original_path)
        print(f"Received file content type: {audio_file.content_type}")

        # WebM to MP3 변환
        try:
            subprocess.run(
                ['/usr/bin/ffmpeg', '-y', '-i', original_path, '-f', 'mp3', '-ab', '192k', converted_path],
                check=True
            )
            print("Audio file converted to MP3 format.")
        except subprocess.CalledProcessError as e:
            print("Error during audio conversion:", e)
            return jsonify({"error": "Audio conversion failed"}), 500
        
        # finally:
        # # 파일 삭제
        #     if os.path.exists(original_path):
        #         os.remove(original_path)
        #         print(f"Deleted temporary file: {original_path}")
        #     if os.path.exists(converted_path):
        #         os.remove(converted_path)
        #         print(f"Deleted converted file: {converted_path}")
            
        
        

        # 네이버 API로 변환된 MP3 파일 전송
        url = "https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor"  # 언어 코드 추가
        headers = {
            "X-NCP-APIGW-API-KEY-ID": os.getenv("NAVER_CLIENT_ID"),
            "X-NCP-APIGW-API-KEY": os.getenv("NAVER_CLIENT_SECRET"),
            "Content-Type": "application/octet-stream",
        }

        with open(converted_path, 'rb') as mp3_file:
            response = requests.post(url, headers=headers, data=mp3_file)

        if response.status_code == 200:
            result_text = response.json().get("text", "")
            return jsonify({"transcript": result_text})
        else:
            print("Error during STT process:", response.text)
            return jsonify({
                "error": "Failed to process audio", 
                "details": response.text,
                "status_code": response.status_code
            }), response.status_code
    
        
    @app.route('/api/play_voice', methods=['POST'])
    def play_voice():
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        url = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"
        headers = {
            "X-NCP-APIGW-API-KEY-ID": os.getenv("NAVER_CLIENT_ID"),
            "X-NCP-APIGW-API-KEY": os.getenv("NAVER_CLIENT_SECRET"),
            "Content-Type": "application/x-www-form-urlencoded",
        }
        payload = {
            "speaker": "jinho",  # TTS 목소리 설정 (mijin: 여성, jinho: 남성 등)
            "speed": "2",        # 말하기 속도 조절 (-5 ~ 5)
            "text": text,
        }
        try:
            response = requests.post(url, headers=headers, data=payload)
            response.raise_for_status()  # 200 OK가 아닐 경우 예외 발생
            audio_content = response.content

            # 생성된 음성 파일을 반환
            return send_file(BytesIO(audio_content), mimetype="audio/mpeg")
        
        except requests.exceptions.RequestException as e:
            print(f"TTS API Error: {e}")
            return jsonify({"error": "Failed to fetch TTS audio"}), 500
        
        
        
####################################################################################

# NAVER Trend 

    def make_api_request(url, headers, body):
        request = urllib.request.Request(url, data=body.encode("utf-8"))
        for key, value in headers.items():
            request.add_header(key, value)
        try:
            with urllib.request.urlopen(request) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print("Exception:", str(e))
            return {"error": str(e)}

    def get_search_trend(keyword_groups, start_date="2024-10-01", end_date="2024-11-01", time_unit="month", ages=None, gender=None):
        url = "https://naveropenapi.apigw.ntruss.com/datalab/v1/search"
        headers = {
            "X-NCP-APIGW-API-KEY-ID": os.getenv("NAVER_TREND_CLIENT_ID"),
            "X-NCP-APIGW-API-KEY": os.getenv("NAVER_TREND_CLIENT_SECRET"),
            "Content-Type": "application/json"
        }
        body = json.dumps({
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": time_unit,
            "keywordGroups": keyword_groups,
            "gender": gender or "",
            "ages": ages or []
        })
        return make_api_request(url, headers, body)

    def parse_keywords(input_text):
        keywords = [kw.strip() for kw in input_text.split(',')]
        keyword_groups = [{"groupName": kw, "keywords": [kw]} for kw in keywords]
        return keyword_groups

    @app.route("/api/search-trend", methods=["POST"])
    def search_trend():
        data = request.get_json()
        keywords = data.get("keywords", "")
        start_date = data.get("start_date", (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d"))
        end_date = data.get("end_date", datetime.today().strftime("%Y-%m-%d"))
        time_unit = data.get("time_unit", "month")
        ages = data.get("ages", [])
        gender = data.get("gender", "")

        keyword_groups = parse_keywords(keywords)
        response_data = get_search_trend(keyword_groups, start_date, end_date, time_unit, ages, gender)
        return jsonify(response_data)