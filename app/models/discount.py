from app import db
from datetime import datetime

class Discount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reason = db.Column(db.String(64))  # 'falta' o 'impuntualidad'
    description = db.Column(db.Text)
    hours_deducted = db.Column(db.Float)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<Discount {self.reason} - {self.hours_deducted}h>'
