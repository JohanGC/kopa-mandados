import React from 'react';
import { Link } from 'react-router-dom';
import GoogleMap from '../components/GoogleMap';

const Home = () => {
  const slides = [
    {
      id: 1,
      title: "Ofertas Exclusivas",
      description: "Descubre descuentos especiales en tus marcas favoritas",
      image: "/images/img1.jpg",
      buttonText: "Ver Ofertas",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      link: "/offers",
      icon: "🎯"
    },
    {
      id: 2,
      title: "Actividades Únicas",
      description: "Participa en experiencias inolvidables cerca de ti",
      image: "/images/img2.jpg",
      buttonText: "Explorar Actividades",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      link: "/activities",
      icon: "🌟"
    },
    {
      id: 3,
      title: "Beneficios Exclusivos",
      description: "Solo para usuarios registrados",
      image: "/images/img3.jpg",
      buttonText: "Registrarse",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      link: "/register",
      icon: "👑"
    }
  ];

  const features = [
    {
      icon: "📱",
      title: "Acceso Multiplataforma",
      description: "Disponible en web y aplicación móvil para que accedas desde cualquier dispositivo",
      color: "primary"
    },
    {
      icon: "👀",
      title: "Navega Sin Límites",
      description: "Explora todas nuestras ofertas y actividades sin necesidad de crear una cuenta",
      color: "success"
    },
    {
      icon: "🎯",
      title: "Participa y Gana",
      description: "Regístrate para participar en actividades exclusivas y obtener recompensas especiales",
      color: "warning"
    }
  ];

  const stats = [
    { number: "500+", label: "Ofertas Activas" },
    { number: "1K+", label: "Usuarios Satisfechos" },
    { number: "50+", label: "Socios Comerciales" },
    { number: "24/7", label: "Disponibilidad" }
  ];

  return (
    <div className="home-modern">
      {/* Hero Slider Moderno */}
      <section className="hero-slider-section">
        <div 
          id="modernCarousel" 
          className="modern-carousel carousel slide" 
          data-bs-ride="carousel"
          data-bs-interval="4000"
        >
          <div className="carousel-indicators modern-indicators">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                data-bs-target="#modernCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-label={`Slide ${index + 1}`}
              ></button>
            ))}
          </div>
          
          <div className="carousel-inner">
            {slides.map((slide, index) => (
              <div key={slide.id} className={`carousel-item modern-slide ${index === 0 ? 'active' : ''}`}>
                <div className="slide-background">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="slide-image"
                  />
                  <div className="slide-overlay" style={{ background: slide.gradient }}></div>
                </div>
                <div className="container">
                  <div className="slide-content">
                    
                    <h1 className="slide-title">{slide.title}</h1>
                    <p className="slide-description">{slide.description}</p>
                    <Link 
                      to={slide.link} 
                      className="btn btn-modern btn-lg slide-btn"
                    >
                      {slide.buttonText}
                      <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="carousel-control-prev modern-control" type="button" data-bs-target="#modernCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Anterior</span>
          </button>
          <button className="carousel-control-next modern-control" type="button" data-bs-target="#modernCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Siguiente</span>
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5">
        <div className="container">
          <div className="row g-4">
            {stats.map((stat, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <div className="stat-card text-center">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content">
                <h1 className="hero-title">
                  Descubre las mejores 
                  <span className="gradient-text"> ofertas y actividades</span>
                </h1>
                <p className="hero-description">
                  Explora nuestro catálogo sin necesidad de registro o inicia sesión para 
                  participar y disfrutar de beneficios exclusivos. Tu próxima gran experiencia 
                  está a solo un clic de distancia.
                </p>
                <div className="hero-buttons">
                  <Link to="/offers" className="btn btn-primary btn-modern btn-lg me-3">
                    <i className="bi bi-lightning-fill me-2"></i>
                    Ver Ofertas Disponibles
                  </Link>
                  <Link to="/activities" className="btn btn-outline-primary btn-modern btn-lg">
                    Explorar Actividades
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-visual">
                <div className="floating-card card-1">
                  <div className="card-icon">🔥</div>
                  <div className="card-content">
                    <strong>Ofertas Flash</strong>
                    <small>Hasta 70% descuento</small>
                  </div>
                </div>
                <div className="floating-card card-2">
                  <div className="card-icon">🎉</div>
                  <div className="card-content">
                    <strong>Eventos VIP</strong>
                    <small>Acceso exclusivo</small>
                  </div>
                </div>
                <div className="floating-card card-3">
                  <div className="card-icon">🚀</div>
                  <div className="card-content">
                    <strong>Nuevo cada día</strong>
                    <small>Contenido fresco</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title">¿Por qué elegirnos?</h2>
            <p className="section-subtitle">Te ofrecemos la mejor experiencia para descubrir ofertas y actividades</p>
          </div>
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div className={`feature-card feature-${feature.color}`}>
                  
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-decoration"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section py-5">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title">Encuentra cerca de ti</h2>
            <p className="section-subtitle">Descubre ofertas y actividades en tu ubicación actual</p>
          </div>
          <div className="modern-map-container">
            <GoogleMap />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;