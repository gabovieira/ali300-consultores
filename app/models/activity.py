from app import db
from datetime import datetime

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(64))  # 'requerimiento' o 'incidencia'
    title = db.Column(db.String(128))
    description = db.Column(db.Text)
    hours_spent = db.Column(db.Float)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<Activity {self.title}>'
