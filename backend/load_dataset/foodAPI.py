import mysql.connector
import os
from dotenv import load_dotenv
import requests

# 환경 변수 로드
load_dotenv()

# MySQL 연결 설정
db_connection = mysql.connector.connect(
    user=os.getenv('DB_USERNAME'),
    password=os.getenv('DB_PASSWORD'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME')
)

cursor = db_connection.cursor()

# API 호출 URL 및 인증키 설정
API_KEY = os.getenv('FOOD_API_KEY')
service_id = "COOKRCP01"
data_type = "json"
start_idx = 1
end_idx = 1000

# API 호출 URL 구성
api_url = f"http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/{service_id}/{data_type}/{start_idx}/{end_idx}"
response = requests.get(api_url)

# 데이터 삽입 함수
# 데이터 삽입 함수 수정
def insert_into_db(item):
    try:
        query = """
        INSERT INTO rcp_set (
            rcp_seq, rcp_nm, rcp_way2, rcp_pat2, info_wgt, info_eng, info_car, info_pro,
            info_fat, info_na, hash_tag, att_file_no_main, att_file_no_mk, rcp_parts_dtls,
            manual01, manual_img01, manual02, manual_img02, manual03, manual_img03,
            manual04, manual_img04, manual05, manual_img05, manual06, manual_img06,
            manual07, manual_img07, manual08, manual_img08, manual09, manual_img09,
            manual10, manual_img10, manual11, manual_img11, manual12, manual_img12,
            manual13, manual_img13, manual14, manual_img14, manual15, manual_img15,
            manual16, manual_img16, manual17, manual_img17, manual18, manual_img18,
            manual19, manual_img19, manual20, manual_img20, rcp_na_tip
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # 각 필드를 가져올 때 기본값을 빈 문자열로 설정하고 모든 파라미터에 대해 빈 문자열로 대체
        values = (
            item.get('RCP_SEQ', ''), item.get('RCP_NM', ''), item.get('RCP_WAY2', ''), item.get('RCP_PAT2', ''), item.get('INFO_WGT', ''),
            item.get('INFO_ENG', ''), item.get('INFO_CAR', ''), item.get('INFO_PRO', ''),
            item.get('INFO_FAT', ''), item.get('INFO_NA', ''), item.get('HASH_TAG', ''),
            item.get('ATT_FILE_NO_MAIN', ''), item.get('ATT_FILE_NO_MK', ''), item.get('RCP_PARTS_DTLS', ''),
            item.get('MANUAL01', ''), item.get('MANUAL_IMG01', ''), item.get('MANUAL02', ''), item.get('MANUAL_IMG02', ''),
            item.get('MANUAL03', ''), item.get('MANUAL_IMG03', ''), item.get('MANUAL04', ''), item.get('MANUAL_IMG04', ''),
            item.get('MANUAL05', ''), item.get('MANUAL_IMG05', ''), item.get('MANUAL06', ''), item.get('MANUAL_IMG06', ''),
            item.get('MANUAL07', ''), item.get('MANUAL_IMG07', ''), item.get('MANUAL08', ''), item.get('MANUAL_IMG08', ''),
            item.get('MANUAL09', ''), item.get('MANUAL_IMG09', ''), item.get('MANUAL10', ''), item.get('MANUAL_IMG10', ''),
            item.get('MANUAL11', ''), item.get('MANUAL_IMG11', ''), item.get('MANUAL12', ''), item.get('MANUAL_IMG12', ''),
            item.get('MANUAL13', ''), item.get('MANUAL_IMG13', ''), item.get('MANUAL14', ''), item.get('MANUAL_IMG14', ''),
            item.get('MANUAL15', ''), item.get('MANUAL_IMG15', ''), item.get('MANUAL16', ''), item.get('MANUAL_IMG16', ''),
            item.get('MANUAL17', ''), item.get('MANUAL_IMG17', ''), item.get('MANUAL18', ''), item.get('MANUAL_IMG18', ''),
            item.get('MANUAL19', ''), item.get('MANUAL_IMG19', ''), item.get('MANUAL20', ''), item.get('MANUAL_IMG20', ''),
            item.get('RCP_NA_TIP', '')
        )
        
        # 쿼리 실행
        cursor.execute(query, values)
        print(f"성공적으로 삽입됨: {item.get('RCP_NM', '')}")
    
    except Exception as e:
        print(f"DB 삽입 오류: {e}")


# 응답 상태 확인
if response.status_code == 200:
    print("API 호출 성공")
    data = response.json()
    # print(data)
    # 'row' 키가 있는지 확인하고 데이터 삽입
    if 'COOKRCP01' in data and 'row' in data['COOKRCP01']:
        for item in data['COOKRCP01']['row']:
            insert_into_db(item)
        
        # DB에 반영
        db_connection.commit()
        print("DB에 모든 데이터 커밋 완료.")
    else:
        print("'row' 키가 응답에 존재하지 않거나 데이터가 없습니다.")
else:
    print(f"API 호출 실패: {response.status_code}")

# 커서 및 연결 종료
cursor.close()
db_connection.close()
