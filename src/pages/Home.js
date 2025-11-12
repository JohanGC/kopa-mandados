import React from 'react';
import { Link } from 'react-router-dom';
{/*import LocationMap from '../components/LocationMap';*/}
import GoogleMap from '../components/GoogleMap';

const Home = () => {
  const slides = [
    {
      id: 1,
      title: "Ofertas Exclusivas",
      description: "Descubre descuentos especiales en tus marcas favoritas",
      image: "/images/img1.jpg",
      buttonText: "Ver Ofertas",
      link: "/offers"
    },
    {
      id: 2,
      title: "Actividades Únicas",
      description: "Participa en experiencias inolvidables cerca de ti",
      image: "/images/img2.jpg",
      buttonText: "Explorar Actividades",
      link: "/activities"
    },
    {
      id: 3,
      title: "Beneficios Exclusivos",
      description: "Solo para usuarios registrados",
      image: "/images/img3.jpg",
      buttonText: "Registrarse",
      link: "/register"
    }
  ];

  return (
    <div className="container mt-4">
      {/* Slider Bootstrap con auto-rotación */}
      <div 
        id="homeCarousel" 
        className="carousel slide mb-5" 
        data-bs-ride="carousel"
        data-bs-interval="3000" // Cambia cada 3 segundos
      >
        <div className="carousel-indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              data-bs-target="#homeCarousel"
              data-bs-slide-to={index}
              className={index === 0 ? "active" : ""}
              aria-current={index === 0 ? "true" : "false"}
              aria-label={`Slide ${index + 1}`}
            ></button>
          ))}
        </div>
        
        <div className="carousel-inner rounded-3">
          {slides.map((slide, index) => (
            <div key={slide.id} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
              <img 
                src={slide.image} 
                className="d-block w-100" 
                alt={slide.title}
                style={{ height: '400px', objectFit: 'cover' }}
              />
              <div className="carousel-caption fond-slid d-none d-md-block bg-dark bg-opacity-50 rounded p-4">
                <h3 className="display-6">{slide.title}</h3>
                <p className="lead">{slide.description}</p>
                <Link to={slide.link} className="btn btn-primary btn-lg">
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Anterior</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Siguiente</span>
        </button>
      </div>


      <section className="text-center mb-5">
        <h1 className="display-4 mb-4">Descubre las mejores ofertas y actividades</h1>
        <p className="lead mb-4">Explora nuestro catálogo sin necesidad de registro o inicia sesión para participar y disfrutar de beneficios exclusivos</p>
        <Link to="/offers" className="btn btn-primary btn-lg">Ver ofertas disponibles</Link>
      </section>

      <section className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100 text-center">
            <div className="card-body">
              <div className="display-4 mb-3">📱</div>
              <h3>Acceso Multiplataforma</h3>
              <p>Disponible en web y aplicación móvil para que accedas desde cualquier dispositivo</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 text-center">
            <div className="card-body">
              <div className="display-4 mb-3">👀</div>
              <h3>Navega Sin Límites</h3>
              <p>Explora todas nuestras ofertas y actividades sin necesidad de crear una cuenta</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 text-center">
            <div className="card-body">
              <div className="display-4 mb-3">🎯</div>
              <h3>Participa y Gana</h3>
              <p>Regístrate para participar en actividades exclusivas y obtener recompensas especiales</p>
            </div>
          </div>
        </div>
      </section>
      <div className="container mt-4">
        {/* Mapa de domiciliarios */}
        <GoogleMap />
      </div>
    </div>
  );
};

export default Home;