from flask_login import UserMixin
from app import db, login
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    level = db.Column(db.String(64), default='consultor')
    development_hours = db.Column(db.Float, default=8.0)  # Horas de desarrollo diarias por defecto
    training_hours = db.Column(db.Float, default=1.6)  # Horas de adiestramiento diarias por defecto (20% de 8 horas)
    activities = db.relationship('Activity', backref='user', lazy='dynamic')
    discounts = db.relationship('Discount', backref='user', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username}>'

    def calculate_training_hours(self, development_hours_spent):
        """Calcula las horas de adiestramiento basadas en las horas de desarrollo."""
        if self.development_hours is None or self.development_hours == 0 or self.training_hours is None:
            return 0
        return (self.training_hours / self.development_hours) * development_hours_spent

    def check_daily_limit(self, development_hours_spent):
        """Verifica que las horas de desarrollo no excedan el límite diario."""
        from app.models.activity import Activity  # Importar aquí para evitar importaciones circulares
        
        if self.development_hours is None:
            return True  # Si no hay límite configurado, permitir cualquier cantidad de horas
            
        total_dev_hours = Activity.query.filter_by(user_id=self.id).filter(
            Activity.date >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).with_entities(db.func.sum(Activity.hours_spent)).scalar() or 0
        
        return total_dev_hours + development_hours_spent <= self.development_hours

@login.user_loader
def load_user(id):
    return User.query.get(int(id))
