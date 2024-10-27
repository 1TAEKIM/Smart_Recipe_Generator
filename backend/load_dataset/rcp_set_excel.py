import mysql.connector
import pandas as pd
from dotenv import load_dotenv
import os

# 환경 변수 로드
load_dotenv()

# MySQL 연결 설정
db_connection = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USERNAME'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)

# 데이터 불러오기
def fetch_data_from_db():
    try:
        query = "SELECT * FROM rcp_set"
        df = pd.read_sql(query, db_connection)  # pandas를 이용하여 SQL 실행 결과를 DataFrame으로 변환
        return df
    except Exception as e:
        print(f"데이터 불러오기 실패: {e}")
        return None

# 엑셀 파일로 저장
def save_to_excel(df):
    try:
        excel_filename = "recipe_data.xlsx"
        df.to_excel(excel_filename, index=False, engine='openpyxl')  # DataFrame을 엑셀 파일로 저장
        print(f"엑셀 파일로 저장 완료: {excel_filename}")
    except Exception as e:
        print(f"엑셀 파일 저장 실패: {e}")

# 데이터 불러와서 엑셀로 저장
df = fetch_data_from_db()
if df is not None:
    save_to_excel(df)

# 연결 종료
db_connection.close()
