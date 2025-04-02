from app import create_app, db
from app.models import User, Activity, Discount

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Activity': Activity, 'Discount': Discount}

if __name__ == '__main__':
    app.run(debug=True)
