import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, UserPlus, LogIn, ArrowRight, Menu, X } from 'lucide-react';
import { ListTodo, BarChart3, Clock, Users, Phone, Info, Home } from 'lucide-react';
import AuthScreen from './AuthScreen';
import Icon from './Icon';

const WelcomePage: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeSection, setActiveSection] = useState('inicio');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      
      // Determinar la sección activa basada en la posición de scroll
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop - 100;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        const sectionId = section.getAttribute('id') || '';
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  if (showAuth) {
    return <AuthScreen initialMode={authMode} onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrollPosition > 50 ? 'bg-gray-900/95 py-2 shadow-lg' : 'bg-gray-900 py-4'}`}>
        <div className="container mx-auto flex justify-between items-center px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo sin fondo rojo */}
            <div className="flex items-center transition-transform hover:scale-105">
              <img src="/logo.png" alt="Logo ALI 3000" className="w-16 h-16 sm:w-24 sm:h-24" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/96')} />
            </div>
          </div>
          
          {/* Menú de navegación desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              onClick={() => scrollToSection('inicio')} 
              className={`flex items-center gap-2 cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'inicio' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="Home" className="w-4 h-4" />
              <span>Inicio</span>
            </a>
            <a 
              onClick={() => scrollToSection('caracteristicas')} 
              className={`flex items-center gap-2 cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'caracteristicas' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="ListTodo" className="w-4 h-4" />
              <span>Características</span>
            </a>
            <a 
              onClick={() => scrollToSection('nosotros')} 
              className={`flex items-center gap-2 cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'nosotros' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="Info" className="w-4 h-4" />
              <span>Nosotros</span>
            </a>
            <a 
              onClick={() => scrollToSection('contacto')} 
              className={`flex items-center gap-2 cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'contacto' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="Phone" className="w-4 h-4" />
              <span>Contacto</span>
            </a>
          </nav>

          {/* Botón de menú móvil */}
          <button 
            className="md:hidden p-2 text-white hover:text-cyan-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Botones de inicio de sesión y registro */}
          <div className="hidden md:flex gap-4">
            <button
              onClick={handleLogin}
              className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-all hover:scale-110 hover:rotate-3"
              title="Iniciar Sesión"
            >
              <Icon name="LogIn" className="w-5 h-5" />
            </button>
            <button
              onClick={handleRegister}
              className="bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full transition-all hover:scale-110 hover:-rotate-3"
              title="Registrarse"
            >
              <Icon name="UserPlus" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        <div className={`md:hidden fixed inset-0 bg-gray-900/95 z-40 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <a 
              onClick={() => {
                scrollToSection('inicio');
                setIsMenuOpen(false);
              }} 
              className={`flex items-center gap-2 text-lg cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'inicio' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="Home" className="w-5 h-5" />
              <span>Inicio</span>
            </a>
            <a 
              onClick={() => {
                scrollToSection('caracteristicas');
                setIsMenuOpen(false);
              }} 
              className={`flex items-center gap-2 text-lg cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'caracteristicas' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="ListTodo" className="w-5 h-5" />
              <span>Características</span>
            </a>
            <a 
              onClick={() => {
                scrollToSection('nosotros');
                setIsMenuOpen(false);
              }} 
              className={`flex items-center gap-2 text-lg cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'nosotros' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="Info" className="w-5 h-5" />
              <span>Nosotros</span>
            </a>
            <a 
              onClick={() => {
                scrollToSection('contacto');
                setIsMenuOpen(false);
              }} 
              className={`flex items-center gap-2 text-lg cursor-pointer transition-colors hover:text-cyan-400 ${activeSection === 'contacto' ? 'text-cyan-400' : 'text-white'}`}
            >
              <Icon name="Phone" className="w-5 h-5" />
              <span>Contacto</span>
            </a>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  handleLogin();
                  setIsMenuOpen(false);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Icon name="LogIn" className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </button>
              <button
                onClick={() => {
                  handleRegister();
                  setIsMenuOpen(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Icon name="UserPlus" className="w-5 h-5" />
                <span>Registrarse</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 md:pt-44 pb-20 md:pb-28 px-4 sm:px-6 relative">
        {/* Imagen de fondo con overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-800/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=2000&q=80" 
            alt="Fondo tecnológico" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto text-center relative z-20 mt-4 md:mt-8">
          <div className="animate-fadeIn opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">
              Gestiona tus requerimientos con la excelencia de ALI 3000
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-4 md:mb-6 max-w-3xl mx-auto px-4">
              Plataforma integral para consultores IT especializados en el sector asegurador.
              Optimiza la gestión de tus proyectos mientras desarrollas tus habilidades profesionales.
            </p>
            <p className="text-base sm:text-lg text-cyan-400 mb-8 md:mb-10 max-w-2xl mx-auto px-4">
              Formando consultores de excelencia a través de nuestro Taller de Formación para el Trabajo
            </p>
            <div className="flex justify-center gap-4 px-4">
              <button
                onClick={handleRegister}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-medium flex items-center gap-2 transition-all hover:translate-y-[-5px] hover:shadow-lg w-full sm:w-auto justify-center"
              >
                Comenzar ahora
                <Icon name="ArrowRight" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="py-12 md:py-16 px-4 sm:px-6 bg-gray-800 bg-opacity-50">
        <div className="container mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 animate-slide-in">
            Características principales
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Características con efectos de animación al hacer scroll */}
            <div className="bg-gray-750 rounded-lg p-4 md:p-6 shadow-lg flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <div className="bg-cyan-900 p-3 rounded-full mb-4">
                <Icon name="ListTodo" className="text-cyan-300 w-6 md:w-8 h-6 md:h-8" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-3">Gestión de Requerimientos</h4>
              <p className="text-sm md:text-base text-gray-300">
                Crea, organiza y gestiona tus requerimientos por tipo. Desde ajustes e incidencias hasta proyectos completos.
              </p>
            </div>
            
            <div className="bg-gray-750 rounded-lg p-4 md:p-6 shadow-lg flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <div className="bg-cyan-900 p-3 rounded-full mb-4">
                <Icon name="CheckCircle" className="text-cyan-300 w-6 md:w-8 h-6 md:h-8" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-3">Seguimiento de Tareas</h4>
              <p className="text-sm md:text-base text-gray-300">
                Divide tus requerimientos en tareas específicas y realiza seguimiento del estado de cada una de ellas.
              </p>
            </div>
            
            <div className="bg-gray-750 rounded-lg p-4 md:p-6 shadow-lg flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <div className="bg-cyan-900 p-3 rounded-full mb-4">
                <Icon name="Clock" className="text-cyan-300 w-6 md:w-8 h-6 md:h-8" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-3">Control de Tiempo</h4>
              <p className="text-sm md:text-base text-gray-300">
                Establece tiempos estimados y registra el tiempo dedicado a cada requerimiento y tarea.
              </p>
            </div>
            
            <div className="bg-gray-750 rounded-lg p-4 md:p-6 shadow-lg flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <div className="bg-cyan-900 p-3 rounded-full mb-4">
                <Icon name="BarChart3" className="text-cyan-300 w-6 md:w-8 h-6 md:h-8" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-3">Métricas y Estadísticas</h4>
              <p className="text-sm md:text-base text-gray-300">
                Visualiza el progreso de tus proyectos con métricas claras y paneles gráficos de fácil interpretación.
              </p>
            </div>
            
            <div className="bg-gray-750 rounded-lg p-4 md:p-6 shadow-lg flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <div className="bg-cyan-900 p-3 rounded-full mb-4">
                <Icon name="Users" className="text-cyan-300 w-6 md:w-8 h-6 md:h-8" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-3">Multiusuario</h4>
              <p className="text-sm md:text-base text-gray-300">
                Cada usuario tiene acceso a sus propios requerimientos y tareas, manteniendo sus datos privados y seguros.
              </p>
            </div>
            
            <div className="bg-gray-750 rounded-lg p-4 md:p-6 shadow-lg flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
              <div className="bg-cyan-900 p-3 rounded-full mb-4">
                <Icon name="LogIn" className="text-cyan-300 w-6 md:w-8 h-6 md:h-8" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-3">Fácil de Usar</h4>
              <p className="text-sm md:text-base text-gray-300">
                Interfaz intuitiva y amigable que te permite comenzar a gestionar tus requerimientos de inmediato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us - Nueva sección */}
      <section id="nosotros" className="py-16 px-6 bg-gray-900">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8 animate-slide-in">Sobre ALI 3000 CONSULTORES</h3>
          
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg mb-8 animate-fade-in-up">
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              En <span className="text-cyan-400 font-semibold">ALI 3000 CONSULTORES</span>, nos distinguimos por mantener nuestro 
              <span className="text-purple-400 font-semibold"> Taller de Formación para el Trabajo</span>, donde la gran mayoría de nuestros 
              Consultores han sido formados. Somos especialistas en desarrollo Oracle para el mercado Asegurador.
            </p>
            
            <h4 className="text-xl font-semibold mb-4 text-cyan-300">Nuestro Equipo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-750 p-4 rounded-lg transition-transform hover:translate-y-[-5px]">
                <h5 className="font-medium text-white mb-2">Desarrollo</h5>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Desarrolladores Oracle</li>
                  <li>Desarrolladores Web</li>
                  <li>Administradores de BD Oracle</li>
                </ul>
              </div>
              <div className="bg-gray-750 p-4 rounded-lg transition-transform hover:translate-y-[-5px]">
                <h5 className="font-medium text-white mb-2">Análisis</h5>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Analistas de Procesos</li>
                  <li>Analistas Funcionales</li>
                  <li>Analistas de Calidad</li>
                </ul>
              </div>
              <div className="bg-gray-750 p-4 rounded-lg transition-transform hover:translate-y-[-5px]">
                <h5 className="font-medium text-white mb-2">Especialización</h5>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Mercado Asegurador</li>
                  <li>Automatización de Procesos</li>
                  <li>Integración de Sistemas</li>
                </ul>
              </div>
            </div>
            
            <h4 className="text-xl font-semibold mb-4 text-cyan-300">Soluciones Desarrolladas</h4>
            <p className="text-lg text-gray-300 mb-4 leading-relaxed">
              Hemos trabajado en mejoras para aplicativos existentes en el mercado asegurador, con enfoque en la descentralización y eficiencia:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
              <li>Cotizadores Emisores de Pólizas Patrimoniales</li>
              <li>Módulos de Disponibilidad Bancaria</li>
              <li>Automatización de Finiquitos de Automóvil</li>
              <li>Conciliaciones Bancarias</li>
              <li>Integración con sistemas de tarifación</li>
            </ul>
            
            <div className="bg-gradient-to-r from-cyan-900 to-blue-900 p-6 rounded-lg transform transition-all hover:scale-[1.02]">
              <p className="text-white text-center font-medium">
                Nuestro norte es la excelencia técnica y la formación continua de profesionales en tecnología.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Contacto - Nueva */}
      <section id="contacto" className="py-16 px-6 bg-gray-800">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-10 animate-slide-in">Contacto</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-gray-750 p-8 rounded-xl shadow-lg animate-fade-in-left">
              <h4 className="text-2xl font-semibold mb-6 text-cyan-300">Información de Contacto</h4>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-cyan-900 p-3 rounded-full">
                    <Icon name="Home" className="text-cyan-300 w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-1">Dirección</h5>
                    <p className="text-gray-300">Calle Principal, Edificio Corporativo, Piso 5, Caracas, Venezuela</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-cyan-900 p-3 rounded-full">
                    <Icon name="Phone" className="text-cyan-300 w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-1">Teléfono</h5>
                    <p className="text-gray-300">+58 (212) 555-5555</p>
                    <p className="text-gray-300">+58 (412) 555-5555</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-cyan-900 p-3 rounded-full">
                    <Icon name="LogIn" className="text-cyan-300 w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-1">Email</h5>
                    <p className="text-gray-300">contacto@ali3000.com</p>
                    <p className="text-gray-300">soporte@ali3000.com</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h5 className="font-medium text-white mb-4">Horario de Atención</h5>
                <p className="text-gray-300">Lunes a Viernes: 8:30 AM - 5:00 PM</p>
                <p className="text-gray-300">Sábados y Domingos: Cerrado</p>
              </div>
            </div>
            
            <div className="bg-gray-750 p-8 rounded-xl shadow-lg animate-fade-in-right">
              <h4 className="text-2xl font-semibold mb-6 text-cyan-300">Envíanos un Mensaje</h4>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-colors"
                    placeholder="Tu email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Asunto</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-colors"
                    placeholder="Asunto del mensaje"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Mensaje</label>
                  <textarea 
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg h-32 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-colors"
                    placeholder="Tu mensaje"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-4 rounded-lg transition-all hover:shadow-lg"
                >
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-cyan-900 to-blue-900">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6 animate-pulse">¿Listo para empezar?</h3>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Regístrate ahora y comienza a organizar y gestionar todos tus requerimientos de manera eficiente.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleRegister}
              className="bg-white text-cyan-900 hover:bg-gray-200 px-8 py-3 rounded-lg text-lg font-medium flex items-center gap-2 transition-all hover:scale-105"
            >
              <Icon name="UserPlus" className="w-5 h-5" />
              Crear una cuenta
            </button>
            <button
              onClick={handleLogin}
              className="bg-transparent border border-white text-white hover:bg-white hover:text-cyan-900 px-8 py-3 rounded-lg text-lg font-medium flex items-center gap-2 transition-all hover:scale-105"
            >
              <Icon name="LogIn" className="w-5 h-5" />
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div className="transform transition-all hover:translate-y-[-5px]">
              <h4 className="text-white font-semibold text-lg mb-4">ALI 3000 CONSULTORES</h4>
              <p className="text-gray-400">
                Empresa especializada en desarrollo Oracle y soluciones para el mercado asegurador.
              </p>
            </div>
            <div className="transform transition-all hover:translate-y-[-5px]">
              <h4 className="text-white font-semibold text-lg mb-4">Contacto</h4>
              <p className="text-gray-400">
                <span className="block mb-1">Caracas, Venezuela</span>
                <span className="block mb-1">contacto@ali3000.com</span>
                <span className="block">+58 (212) 555-5555</span>
              </p>
            </div>
            <div className="transform transition-all hover:translate-y-[-5px]">
              <h4 className="text-white font-semibold text-lg mb-4">Enlaces</h4>
              <ul className="text-gray-400 space-y-2">
                <li><a onClick={() => scrollToSection('inicio')} className="hover:text-cyan-400 cursor-pointer transition-colors">Inicio</a></li>
                <li><a onClick={() => scrollToSection('caracteristicas')} className="hover:text-cyan-400 cursor-pointer transition-colors">Características</a></li>
                <li><a onClick={() => scrollToSection('nosotros')} className="hover:text-cyan-400 cursor-pointer transition-colors">Nosotros</a></li>
                <li><a onClick={() => scrollToSection('contacto')} className="hover:text-cyan-400 cursor-pointer transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} ALI 3000. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Botón de regreso arriba - aparece al hacer scroll */}
      {scrollPosition > 500 && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-cyan-600 text-white p-3 rounded-full shadow-lg transition-all hover:bg-cyan-700 hover:scale-110 z-50 animate-bounce"
          title="Volver arriba"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default WelcomePage; 