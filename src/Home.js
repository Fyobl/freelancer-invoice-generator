
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const containerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const sectionStyle = {
    padding: '60px 30px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: 'white'
  };

  const heroStyle = {
    textAlign: 'center',
    padding: '100px 30px 80px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: 'white'
  };

  const featureCardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '20px',
    margin: '20px',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(15px)',
    color: '#333',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    flex: '1',
    minWidth: '300px'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: 'white',
    border: 'none',
    padding: '18px 40px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '20px',
    boxShadow: '0 8px 20px rgba(40, 167, 69, 0.3)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'transparent',
    border: '2px solid white',
    color: 'white',
    marginLeft: '20px',
    boxShadow: '0 8px 20px rgba(255,255,255,0.1)'
  };

  const benefitStyle = {
    background: 'rgba(255,255,255,0.1)',
    padding: '30px',
    borderRadius: '15px',
    margin: '20px 0',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
    margin: '60px 0'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.15)',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  };

  return (
    <div style={containerStyle}>
      {/* Hero Section */}
      <section style={heroStyle}>
        <div style={{ 
          fontSize: '48px', 
          fontWeight: 'bold',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginRight: '15px'
          }}>
            📄
          </span>
          Easy Invoice
        </div>
        
        <h2 style={{ 
          fontSize: '28px', 
          marginBottom: '30px',
          fontWeight: '300',
          lineHeight: '1.4',
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
        }}>
          Professional Invoice Generation Made Simple
        </h2>
        
        <p style={{ 
          fontSize: '20px', 
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.6',
          opacity: '0.9'
        }}>
          Create, manage, and send professional invoices in minutes. 
          Perfect for freelancers, small businesses, and entrepreneurs.
        </p>
        
        <div>
          <Link 
            to="/register" 
            style={buttonStyle}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 30px rgba(40, 167, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(40, 167, 69, 0.3)';
            }}
          >
            Get Started Free
          </Link>
          
          <Link 
            to="/login" 
            style={secondaryButtonStyle}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'transparent';
            }}
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section style={sectionStyle}>
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              ⚡
            </div>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>Fast Setup</h3>
            <p style={{ opacity: '0.8' }}>Create your first invoice in under 5 minutes</p>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              💼
            </div>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>Professional</h3>
            <p style={{ opacity: '0.8' }}>Customizable templates for any business</p>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              📊
            </div>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>Analytics</h3>
            <p style={{ opacity: '0.8' }}>Track payments and business performance</p>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              🔒
            </div>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>Secure</h3>
            <p style={{ opacity: '0.8' }}>Your data is protected and backed up</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={sectionStyle}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '36px', 
          marginBottom: '60px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Everything You Need to Run Your Business
        </h2>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: '0'
        }}>
          <div 
            style={featureCardStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 35px 70px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
            <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#2c3e50' }}>
              Quote Management
            </h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              Create professional quotes and convert them to invoices seamlessly. 
              Track quote status and follow up with clients.
            </p>
          </div>
          
          <div 
            style={featureCardStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 35px 70px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
            <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#2c3e50' }}>
              Client Management
            </h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              Keep all your client information organized. Store contact details, 
              billing addresses, and payment history in one place.
            </p>
          </div>
          
          <div 
            style={featureCardStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 35px 70px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
            <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#2c3e50' }}>
              Product Catalog
            </h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              Build a comprehensive product and service catalog. 
              Add descriptions, pricing, and VAT rates for quick invoice creation.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={sectionStyle}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '36px', 
          marginBottom: '50px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Why Choose Easy Invoice?
        </h2>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={benefitStyle}>
            <h3 style={{ fontSize: '22px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '15px', fontSize: '28px' }}>📧</span>
              Email Integration
            </h3>
            <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
              Connect your own email account to send invoices directly from your business email. 
              Supports Gmail, Outlook, and custom SMTP configurations.
            </p>
          </div>
          
          <div style={benefitStyle}>
            <h3 style={{ fontSize: '22px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '15px', fontSize: '28px' }}>📈</span>
              Business Reports
            </h3>
            <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
              Get insights into your business performance with detailed reports. 
              Track revenue, outstanding payments, and client activity.
            </p>
          </div>
          
          <div style={benefitStyle}>
            <h3 style={{ fontSize: '22px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '15px', fontSize: '28px' }}>⚙️</span>
              Customizable Settings
            </h3>
            <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
              Personalize your invoices with your company logo, colors, and branding. 
              Set up payment terms and default tax rates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        ...sectionStyle, 
        textAlign: 'center',
        padding: '80px 30px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ 
          fontSize: '32px', 
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Ready to Streamline Your Invoicing?
        </h2>
        <p style={{ 
          fontSize: '18px', 
          marginBottom: '40px',
          maxWidth: '500px',
          margin: '0 auto 40px',
          opacity: '0.9'
        }}>
          Join thousands of professionals who trust Easy Invoice for their billing needs.
        </p>
        
        <Link 
          to="/register" 
          style={buttonStyle}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 12px 30px rgba(40, 167, 69, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(40, 167, 69, 0.3)';
          }}
        >
          Start Your Free Account
        </Link>
      </section>
    </div>
  );
}

export default Home;
