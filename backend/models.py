from .extensions import db, bcrypt

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)


class Recipe(db.Model):
    __tablename__ = 'rcp_set'

    id = db.Column(db.Integer, primary_key=True)
    rcp_nm = db.Column(db.Text, nullable=False)  # 레시피 이름
    att_file_no_main = db.Column(db.Text, nullable=True)  # 메인 이미지 URL

    def to_dict(self):
        return {
            'id': self.id,
            'rcp_nm': self.rcp_nm,
            'att_file_no_main': self.att_file_no_main
        }
