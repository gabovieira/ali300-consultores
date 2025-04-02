from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app import db
from app.models import User, Activity, Discount
from datetime import datetime, timedelta

bp = Blueprint('main', __name__)

@bp.route('/')
@bp.route('/dashboard')
@login_required
def dashboard():
    activities = Activity.query.filter_by(user_id=current_user.id).order_by(Activity.date.desc()).limit(5).all()
    discounts = Discount.query.filter_by(user_id=current_user.id).order_by(Discount.date.desc()).limit(5).all()
    
    # Calcular datos por día para la tabla de resumen
    from collections import defaultdict
    import datetime
    
    days_data = defaultdict(lambda: {'development_hours': 0, 'training_hours': 0, 'discount_hours': 0})
    
    # Obtener actividades de los últimos 7 días
    start_date = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent_activities = Activity.query.filter_by(user_id=current_user.id).filter(Activity.date >= start_date).all()
    recent_discounts = Discount.query.filter_by(user_id=current_user.id).filter(Discount.date >= start_date).all()
    
    # Calcular horas por día
    for activity in recent_activities:
        day = activity.date.strftime('%Y-%m-%d')
        if activity.type == 'requerimiento':
            days_data[day]['development_hours'] += activity.hours_spent
            # Calcular horas de formación (20% de las horas de desarrollo)
            days_data[day]['training_hours'] += activity.hours_spent * 0.2
    
    # Agregar descuentos
    for discount in recent_discounts:
        day = discount.date.strftime('%Y-%m-%d')
        days_data[day]['discount_hours'] += discount.hours_deducted
    
    return render_template('main/dashboard.html', activities=activities, discounts=discounts, user=current_user, days_data=days_data)

@bp.route('/new_activity', methods=['GET', 'POST'])
@login_required
def new_activity():
    if request.method == 'POST':
        activity_type = request.form.get('activity_type')
        title = request.form.get('title')
        description = request.form.get('description')
        hours_spent = float(request.form.get('hours_spent'))
        date = datetime.utcnow()

        # Verificar si el usuario tiene un límite diario configurado
        if hasattr(current_user, 'development_hours') and current_user.development_hours is not None:
            if not current_user.check_daily_limit(hours_spent):
                flash('Has excedido el límite diario de horas de desarrollo.', 'error')
                return redirect(url_for('main.new_activity'))

        activity = Activity(
            user_id=current_user.id,
            type=activity_type,  # Asegurarse de que este campo coincida con el modelo
            title=title,
            description=description,
            hours_spent=hours_spent,
            date=date
        )
        db.session.add(activity)
        db.session.commit()

        # Calcular horas de adiestramiento si el usuario tiene configuradas las horas
        training_hours = 0
        if hasattr(current_user, 'development_hours') and current_user.development_hours is not None and \
           hasattr(current_user, 'training_hours') and current_user.training_hours is not None:
            training_hours = current_user.calculate_training_hours(hours_spent)
            flash(f'Actividad registrada exitosamente. Horas de adiestramiento calculadas: {training_hours}', 'success')
        else:
            flash('Actividad registrada exitosamente.', 'success')
            
        return redirect(url_for('main.dashboard'))

    return render_template('main/new_activity.html')

@bp.route('/new_discount', methods=['GET', 'POST'])
@login_required
def new_discount():
    if request.method == 'POST':
        reason = request.form.get('reason')
        description = request.form.get('description')
        hours_deducted = float(request.form.get('hours_lost'))
        date = datetime.utcnow()

        discount = Discount(
            user_id=current_user.id,
            reason=reason,
            description=description,
            hours_deducted=hours_deducted,
            date=date
        )
        db.session.add(discount)
        db.session.commit()

        flash('Descuento registrado exitosamente.', 'success')
        return redirect(url_for('main.dashboard'))

    return render_template('main/new_discount.html')

@bp.route('/reports')
@login_required
def reports():
    # Filtrar por fecha
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    activity_type = request.args.get('activity_type')
    
    query = Activity.query.filter_by(user_id=current_user.id)
    
    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        query = query.filter(Activity.date >= start_date)
    
    if end_date_str:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        query = query.filter(Activity.date <= end_date)
    
    if activity_type:
        query = query.filter(Activity.type == activity_type)
    
    activities = query.order_by(Activity.date.desc()).all()
    
    return render_template('main/reports.html', activities=activities)

@bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        level = request.form.get('level')
        development_hours = float(request.form.get('development_hours'))
        training_hours = float(request.form.get('training_hours'))
        
        current_user.level = level
        current_user.development_hours = development_hours
        current_user.training_hours = training_hours
        
        db.session.commit()
        
        flash('Perfil actualizado exitosamente')
        return redirect(url_for('main.profile'))
    
    return render_template('main/profile.html')
