from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    # Crear un usuario inicial
    user = User(
        username='admin',
        email='admin@example.com',
        password_hash='pbkdf2:sha256:260000$...',  # Aquí iría el hash de la contraseña
        level='trainer',
        development_hours=4.5,
        training_hours=3.5
    )
    db.session.add(user)
    db.session.commit()
    print('Usuario creado exitosamente')
