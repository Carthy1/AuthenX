import React from "react";
import { useNavigate } from "react-router-dom"; 

function Home() {
  const navigate = useNavigate(); 

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>
            The Future of <span className="gradient-text">Digital Trust</span> is Here
          </h1>

          <p>
            AuthenX is a next-generation academic credential verification platform
            designed to eliminate fraud and build trust in digital systems using blockchain.
            It empowers institutions, employers, and individuals to verify certificates instantly
            with absolute cryptographical confidence.
          </p>

          <div className="hero-buttons">
            <button className="main-btn" onClick={() => navigate("/verify")}>
              Verify Certificate
            </button>
            <a href="#how" className="secondary-btn">Learn More</a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <img src="/hero-image.png" alt="Holographic Certificate Verification" className="hero-image" />
          <div className="glow-backdrop"></div>
        </div>
      </section>

      <section id="how" className="how-section">
        <h2>How It Works</h2>
        <div className="features-expanded" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: "800px" }}>
          <div className="feature-card">
            <img src="/feature-registry.png" alt="Registry Validation" className="feature-img" />
            <h3>1. Registry Verification</h3>
            <p>
              Certificates are checked directly against official institutional databases
              to confirm their legitimacy and origin on an immutable ledger.
            </p>
          </div>

          <div className="feature-card">
            <img src="/feature-blockchain.png" alt="Blockchain Storage" className="feature-img" />
            <h3>2. Cryptographic Proof</h3>
            <p>
              Blockchain technology ensures that every certificate is securely recorded
              and mathematically proven to be untampered and globally unique.
            </p>
          </div>
        </div>
      </section>

      <section className="how-section">
        <h2>A Platform Built for <span className="gradient-text">Integrity</span></h2>
        <p style={{ maxWidth: "700px", margin: "0 auto", color: "var(--text-muted)", fontSize: "18px" }}>
          AuthenX ensures trust, transparency, and military-grade security in academic
          verification systems worldwide leveraging Web3 technologies.
        </p>

        <div className="features-expanded" style={{ marginTop: "40px" }}>
          <div className="feature-card">
            <h3>Secure Data Handling</h3>
            <p>
              All user and certificate data are encrypted and securely stored using zero-knowledge architectures,
              preventing unauthorized access or systemic data breaches.
            </p>
          </div>

          <div className="feature-card">
            <h3>Trusted Institutions</h3>
            <p>
              Only verified and audited institutions are allowed to issue certificates,
              ensuring that every single record minted on the platform is perfectly credible.
            </p>
          </div>

          <div className="feature-card">
            <h3>Transparent Verification</h3>
            <p>
              Every verification process is transparent and universally traceable without revealing
              personally identifiable information needlessly, building ultimate confidence.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        ©️ 2026 AuthenX Foundation. All rights reserved.
      </footer>
    </>
  );
}

export default Home;