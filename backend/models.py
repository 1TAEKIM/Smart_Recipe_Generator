from .extensions import db, bcrypt
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    favorite_food = db.Column(db.String(50), nullable=True)  
    spice_level = db.Column(db.Integer, nullable=True)
    grade = db.Column(db.String(50), default='basic', nullable=False)
    birthdate = db.Column(db.Date, nullable=True)

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)


# Conversation 모델 정의
class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    summary_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('conversations', lazy=True))



class Recipe(db.Model):
    __tablename__ = 'rcp_set'

    id = db.Column(db.Integer, primary_key=True)
    rcp_seq = db.Column(db.Text, nullable=True)  # 레시피 고유 ID
    rcp_nm = db.Column(db.Text, nullable=False)  # 레시피 이름
    rcp_way2 = db.Column(db.Text, nullable=True)  # 요리 방법
    rcp_pat2 = db.Column(db.Text, nullable=True)  # 요리 종류
    info_wgt = db.Column(db.Text, nullable=True)  # 중량
    info_eng = db.Column(db.Text, nullable=True)  # 칼로리
    info_car = db.Column(db.Text, nullable=True)  # 탄수화물
    info_pro = db.Column(db.Text, nullable=True)  # 단백질
    info_fat = db.Column(db.Text, nullable=True)  # 지방
    info_na = db.Column(db.Text, nullable=True)  # 나트륨
    hash_tag = db.Column(db.Text, nullable=True)  # 해시태그
    att_file_no_main = db.Column(db.Text, nullable=True)  # 메인 이미지 URL
    att_file_no_mk = db.Column(db.Text, nullable=True)  # 만드는 방법 이미지 URL
    rcp_parts_dtls = db.Column(db.Text, nullable=True)  # 재료 정보
    rcp_na_tip = db.Column(db.Text, nullable=True)  # 요리 팁
    category = db.Column(db.String(50), nullable=True)

    # 20단계 조리 과정과 이미지
    manual01 = db.Column(db.Text, nullable=True)
    manual_img01 = db.Column(db.Text, nullable=True)
    manual02 = db.Column(db.Text, nullable=True)
    manual_img02 = db.Column(db.Text, nullable=True)
    manual03 = db.Column(db.Text, nullable=True)
    manual_img03 = db.Column(db.Text, nullable=True)
    manual04 = db.Column(db.Text, nullable=True)
    manual_img04 = db.Column(db.Text, nullable=True)
    manual05 = db.Column(db.Text, nullable=True)
    manual_img05 = db.Column(db.Text, nullable=True)
    manual06 = db.Column(db.Text, nullable=True)
    manual_img06 = db.Column(db.Text, nullable=True)
    manual07 = db.Column(db.Text, nullable=True)
    manual_img07 = db.Column(db.Text, nullable=True)
    manual08 = db.Column(db.Text, nullable=True)
    manual_img08 = db.Column(db.Text, nullable=True)
    manual09 = db.Column(db.Text, nullable=True)
    manual_img09 = db.Column(db.Text, nullable=True)
    manual10 = db.Column(db.Text, nullable=True)
    manual_img10 = db.Column(db.Text, nullable=True)
    manual11 = db.Column(db.Text, nullable=True)
    manual_img11 = db.Column(db.Text, nullable=True)
    manual12 = db.Column(db.Text, nullable=True)
    manual_img12 = db.Column(db.Text, nullable=True)
    manual13 = db.Column(db.Text, nullable=True)
    manual_img13 = db.Column(db.Text, nullable=True)
    manual14 = db.Column(db.Text, nullable=True)
    manual_img14 = db.Column(db.Text, nullable=True)
    manual15 = db.Column(db.Text, nullable=True)
    manual_img15 = db.Column(db.Text, nullable=True)
    manual16 = db.Column(db.Text, nullable=True)
    manual_img16 = db.Column(db.Text, nullable=True)
    manual17 = db.Column(db.Text, nullable=True)
    manual_img17 = db.Column(db.Text, nullable=True)
    manual18 = db.Column(db.Text, nullable=True)
    manual_img18 = db.Column(db.Text, nullable=True)
    manual19 = db.Column(db.Text, nullable=True)
    manual_img19 = db.Column(db.Text, nullable=True)
    manual20 = db.Column(db.Text, nullable=True)
    manual_img20 = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'rcp_seq': self.rcp_seq,
            'rcp_nm': self.rcp_nm,
            'rcp_way2': self.rcp_way2,
            'rcp_pat2': self.rcp_pat2,
            'info_wgt': self.info_wgt,
            'info_eng': self.info_eng,
            'info_car': self.info_car,
            'info_pro': self.info_pro,
            'info_fat': self.info_fat,
            'info_na': self.info_na,
            'hash_tag': self.hash_tag,
            'att_file_no_main': self.att_file_no_main,
            'att_file_no_mk': self.att_file_no_mk,
            'rcp_parts_dtls': self.rcp_parts_dtls,
            'rcp_na_tip': self.rcp_na_tip,
            'manual01': self.manual01,
            'manual_img01': self.manual_img01,
            'manual02': self.manual02,
            'manual_img02': self.manual_img02,
            'manual03': self.manual03,
            'manual_img03': self.manual_img03,
            'manual04': self.manual04,
            'manual_img04': self.manual_img04,
            'manual05': self.manual05,
            'manual_img05': self.manual_img05,
            'manual06': self.manual06,
            'manual_img06': self.manual_img06,
            'manual07': self.manual07,
            'manual_img07': self.manual_img07,
            'manual08': self.manual08,
            'manual_img08': self.manual_img08,
            'manual09': self.manual09,
            'manual_img09': self.manual_img09,
            'manual10': self.manual10,
            'manual_img10': self.manual_img10,
            'manual11': self.manual11,
            'manual_img11': self.manual_img11,
            'manual12': self.manual12,
            'manual_img12': self.manual_img12,
            'manual13': self.manual13,
            'manual_img13': self.manual_img13,
            'manual14': self.manual14,
            'manual_img14': self.manual_img14,
            'manual15': self.manual15,
            'manual_img15': self.manual_img15,
            'manual16': self.manual16,
            'manual_img16': self.manual_img16,
            'manual17': self.manual17,
            'manual_img17': self.manual_img17,
            'manual18': self.manual18,
            'manual_img18': self.manual_img18,
            'manual19': self.manual19,
            'manual_img19': self.manual_img19,
            'manual20': self.manual20,
            'manual_img20': self.manual_img20
        }
